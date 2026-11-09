-- CreateTable
CREATE TABLE "ProfileSnapshot" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "data" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LevelEvent" (
    "id" SERIAL NOT NULL,
    "level" INTEGER NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,

    CONSTRAINT "LevelEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveSignal" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "online" BOOLEAN NOT NULL,
    "level" INTEGER,
    "observedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiveSignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LevelEvent_at_idx" ON "LevelEvent"("at");
