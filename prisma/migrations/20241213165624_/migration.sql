-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('Admin', 'Premium', 'Basic');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "allowedDownloads" INTEGER NOT NULL,
    "totalDownloads" INTEGER NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gallery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "audioLink" TEXT NOT NULL,
    "isPaid" TEXT NOT NULL,

    CONSTRAINT "Gallery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "videoLinks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isLive" BOOLEAN NOT NULL,
    "videoLink" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "thumbnailLink" TEXT NOT NULL,

    CONSTRAINT "videoLinks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Gallery" ADD CONSTRAINT "Gallery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "videoLinks" ADD CONSTRAINT "videoLinks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
