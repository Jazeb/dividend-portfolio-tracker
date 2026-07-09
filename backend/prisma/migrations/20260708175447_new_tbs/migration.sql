/*
  Warnings:

  - You are about to drop the column `icon` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `symbol` on the `Transaction` table. All the data in the column will be lost.
  - Added the required column `broker` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `portfolioId` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PortfolioStrategy" AS ENUM ('DividendGrowth', 'Retirement', 'Speculative', 'Education', 'Other');

-- DropIndex
DROP INDEX "Transaction_symbol_key";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "icon",
DROP COLUMN "symbol",
ADD COLUMN     "broker" TEXT NOT NULL,
ADD COLUMN     "portfolioId" INTEGER NOT NULL,
ADD COLUMN     "price" INTEGER NOT NULL,
ADD COLUMN     "quantity" INTEGER NOT NULL,
ADD COLUMN     "total" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Portfolio" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "strategy" "PortfolioStrategy" NOT NULL,
    "currentWorth" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Portfolio_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
