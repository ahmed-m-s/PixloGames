-- CreateTable
CREATE TABLE "InternalUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternalUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternalSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InternalUser_email_key" ON "InternalUser"("email");

-- CreateIndex
CREATE INDEX "InternalUser_role_idx" ON "InternalUser"("role");

-- CreateIndex
CREATE INDEX "InternalUser_active_idx" ON "InternalUser"("active");

-- CreateIndex
CREATE UNIQUE INDEX "InternalSession_tokenHash_key" ON "InternalSession"("tokenHash");

-- CreateIndex
CREATE INDEX "InternalSession_userId_idx" ON "InternalSession"("userId");

-- CreateIndex
CREATE INDEX "InternalSession_expiresAt_idx" ON "InternalSession"("expiresAt");

-- AddForeignKey
ALTER TABLE "InternalSession" ADD CONSTRAINT "InternalSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "InternalUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
