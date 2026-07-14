/*
  Warnings:

  - Added the required column `annualDividend` to the `Stock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currentPrice` to the `Stock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dividendYield` to the `Stock` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Stock" ADD COLUMN     "annualDividend" DECIMAL(18,4) NOT NULL,
ADD COLUMN     "currentPrice" DECIMAL(18,4) NOT NULL,
ADD COLUMN     "dividendYield" DECIMAL(18,4) NOT NULL;
