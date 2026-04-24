/*
  Warnings:

  - You are about to drop the column `experience` on the `Interview` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `Interview` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Interview` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `interviewId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Interview" DROP COLUMN "experience",
DROP COLUMN "role";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "interviewId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Interview_userId_key" ON "Interview"("userId");
