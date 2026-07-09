/*
  Warnings:

  - You are about to drop the column `price` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `Transaction` table. All the data in the column will be lost.
  - Added the required column `buyingPrice` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profileId` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `purchaseDate` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalBuyingPrice` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "price",
DROP COLUMN "total",
ADD COLUMN     "buyingPrice" INTEGER NOT NULL,
ADD COLUMN     "profileId" INTEGER NOT NULL,
ADD COLUMN     "purchaseDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "totalBuyingPrice" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
