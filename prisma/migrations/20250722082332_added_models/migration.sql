-- AlterTable
ALTER TABLE "Song" ADD COLUMN     "isForSale" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "SongPurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SongPurchase_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SongPurchase" ADD CONSTRAINT "SongPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongPurchase" ADD CONSTRAINT "SongPurchase_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;
