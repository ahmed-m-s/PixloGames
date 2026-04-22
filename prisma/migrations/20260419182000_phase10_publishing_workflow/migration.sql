-- AlterTable
ALTER TABLE "Game" ADD COLUMN "sourceSubmissionId" TEXT;

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN "publishedAt" TIMESTAMP(3),
ADD COLUMN "publishingNotes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "publishingStatus" TEXT NOT NULL DEFAULT 'not_started';

-- CreateIndex
CREATE UNIQUE INDEX "Game_sourceSubmissionId_key" ON "Game"("sourceSubmissionId");

-- CreateIndex
CREATE INDEX "Game_sourceSubmissionId_idx" ON "Game"("sourceSubmissionId");

-- CreateIndex
CREATE INDEX "Submission_publishingStatus_idx" ON "Submission"("publishingStatus");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_sourceSubmissionId_fkey" FOREIGN KEY ("sourceSubmissionId") REFERENCES "Submission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
