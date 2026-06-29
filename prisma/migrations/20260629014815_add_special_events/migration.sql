-- CreateEnum
CREATE TYPE "SpecialEventType" AS ENUM ('BAPTISM', 'WEDDING', 'BABY_DEDICATION', 'SALVATION', 'OTHER');

-- CreateTable
CREATE TABLE "special_events" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "SpecialEventType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "personId" TEXT NOT NULL,

    CONSTRAINT "special_events_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "special_events" ADD CONSTRAINT "special_events_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
