-- CreateTable
CREATE TABLE "HashedToken" (
    "id" SERIAL NOT NULL,
    "hash" TEXT NOT NULL,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HashedToken_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "HashedToken" ADD CONSTRAINT "HashedToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
