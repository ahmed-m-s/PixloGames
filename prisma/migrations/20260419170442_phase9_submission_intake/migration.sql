-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "abuseScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "coverImageUrl" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "duplicateSignal" TEXT,
ADD COLUMN     "intakeWarnings" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "publisherName" TEXT,
ADD COLUMN     "shortDescription" TEXT,
ADD COLUMN     "sourceType" TEXT NOT NULL DEFAULT 'external_url',
ADD COLUMN     "sourceUrl" TEXT,
ADD COLUMN     "submittedIpHash" TEXT,
ADD COLUMN     "submittedUserAgent" TEXT,
ADD COLUMN     "submitterNotes" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "thumbnailUrl" TEXT,
ADD COLUMN     "websiteUrl" TEXT;

-- CreateIndex
CREATE INDEX "Submission_contactEmail_idx" ON "Submission"("contactEmail");

-- CreateIndex
CREATE INDEX "Submission_submittedAt_idx" ON "Submission"("submittedAt");
