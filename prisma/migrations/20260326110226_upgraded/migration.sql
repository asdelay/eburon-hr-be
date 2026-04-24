/*
  Warnings:

  - A unique constraint covering the columns `[body]` on the table `MagicLink` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "MagicLink_body_key" ON "MagicLink"("body");
