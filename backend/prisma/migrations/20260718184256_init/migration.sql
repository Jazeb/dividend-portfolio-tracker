-- CreateEnum
CREATE TYPE "FundingSource" AS ENUM ('CASH', 'DIVIDEND');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "fundingSource" "FundingSource" NOT NULL DEFAULT 'CASH';
