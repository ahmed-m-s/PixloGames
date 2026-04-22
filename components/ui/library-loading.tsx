export function LibraryLoading() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          className="min-h-[268px] animate-pulse rounded-lg border border-white/10 bg-white/[0.05]"
          key={index}
        >
          <div className="aspect-[16/10] rounded-t-lg bg-white/[0.07]" />
          <div className="space-y-3 p-4">
            <div className="h-5 w-2/3 rounded bg-white/[0.08]" />
            <div className="h-3 w-full rounded bg-white/[0.06]" />
            <div className="h-3 w-1/2 rounded bg-white/[0.06]" />
          </div>
        </div>
      ))}
    </div>
  );
}
