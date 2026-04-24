/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `HashedToken` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `MagicLink` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "HashedToken" DROP CONSTRAINT "HashedToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "MagicLink" DROP CONSTRAINT "MagicLink_userId_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "HashedToken_userId_key" ON "HashedToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MagicLink_userId_key" ON "MagicLink"("userId");

-- AddForeignKey
ALTER TABLE "HashedToken" ADD CONSTRAINT "HashedToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MagicLink" ADD CONSTRAINT "MagicLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
