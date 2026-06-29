-- CreateTable
CREATE TABLE "prayer_requests" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "personId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "prayer_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "prayer_requests" ADD CONSTRAINT "prayer_requests_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
