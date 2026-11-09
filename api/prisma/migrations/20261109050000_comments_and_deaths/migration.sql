-- AlterTable
ALTER TABLE "LevelEvent" ADD COLUMN     "deathsAtStart" INTEGER;

-- CreateTable
CREATE TABLE "Comment" (
    "id" SERIAL NOT NULL,
    "author" VARCHAR(40) NOT NULL,
    "body" VARCHAR(500) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "clientKey" VARCHAR(64) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Comment_createdAt_idx" ON "Comment"("createdAt");

-- CreateIndex
CREATE INDEX "Comment_clientKey_createdAt_idx" ON "Comment"("clientKey", "createdAt");

