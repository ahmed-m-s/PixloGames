import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const chunksDir = path.join(process.cwd(), '.next', 'static', 'chunks');
const maxTotalBytes = Number(process.env.PIXLO_PERF_MAX_STATIC_JS_BYTES ?? 6_000_000);
const maxChunkBytes = Number(process.env.PIXLO_PERF_MAX_SINGLE_JS_BYTES ?? 2_000_000);

async function collectJavaScriptFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        return collectJavaScriptFiles(fullPath);
      }

      if (!entry.name.endsWith('.js') || entry.name.endsWith('.map')) {
        return [];
      }

      return [fullPath];
    })
  );

  return files.flat();
}

function formatBytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

try {
  const files = await collectJavaScriptFiles(chunksDir);
  const sizes = await Promise.all(
    files.map(async (file) => ({
      file,
      size: (await stat(file)).size
    }))
  );
  const total = sizes.reduce((sum, item) => sum + item.size, 0);
  const largest = sizes.reduce((current, item) => (item.size > current.size ? item : current), {
    file: '',
    size: 0
  });
  const failures = [];

  if (total > maxTotalBytes) {
    failures.push(
      `Total static JS ${formatBytes(total)} exceeds budget ${formatBytes(maxTotalBytes)}.`
    );
  }

  if (largest.size > maxChunkBytes) {
    failures.push(
      `Largest JS chunk ${path.relative(process.cwd(), largest.file)} is ${formatBytes(
        largest.size
      )}, above budget ${formatBytes(maxChunkBytes)}.`
    );
  }

  console.log(
    `Performance budget: ${files.length} JS chunks, total ${formatBytes(
      total
    )}, largest ${formatBytes(largest.size)}.`
  );

  if (failures.length > 0) {
    console.error(failures.join('\n'));
    process.exit(1);
  }
} catch (error) {
  console.error(
    error instanceof Error
      ? `Performance budget check failed: ${error.message}`
      : 'Performance budget check failed.'
  );
  process.exit(1);
}
