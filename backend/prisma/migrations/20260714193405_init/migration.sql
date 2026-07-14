-- CreateEnum
CREATE TYPE "DividendQuarter" AS ENUM ('Q1', 'Q2', 'Q3', 'Q4', 'SPECIAL');

-- CreateEnum
CREATE TYPE "DividendStatus" AS ENUM ('ANNOUNCED', 'CANCELLED', 'PAID');

-- CreateEnum
CREATE TYPE "DividendPaymentStatus" AS ENUM ('UPCOMING', 'PAID', 'MISSED');

-- CreateTable
CREATE TABLE "DividendDeclaration" (
    "id" TEXT NOT NULL,
    "stockId" INTEGER NOT NULL,
    "dividendPerShare" DECIMAL(18,4) NOT NULL,
    "announcementDate" TIMESTAMP(3),
    "exDividendDate" TIMESTAMP(3) NOT NULL,
    "bookClosureDate" TIMESTAMP(3) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "financialYear" INTEGER,
    "quarter" "DividendQuarter",
    "status" "DividendStatus" NOT NULL DEFAULT 'ANNOUNCED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DividendDeclaration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DividendPayment" (
    "id" TEXT NOT NULL,
    "eligibleShares" DECIMAL(18,4) NOT NULL,
    "grossDividend" DECIMAL(18,4) NOT NULL,
    "taxRate" DECIMAL(5,2),
    "taxAmount" DECIMAL(18,4),
    "netDividend" DECIMAL(18,4) NOT NULL,
    "status" "DividendPaymentStatus" NOT NULL DEFAULT 'UPCOMING',
    "paidAt" TIMESTAMP(3),
    "profileId" INTEGER NOT NULL,
    "declarationId" TEXT NOT NULL,
    "portfolioId" INTEGER NOT NULL,
    "holdingId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DividendPayment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DividendDeclaration" ADD CONSTRAINT "DividendDeclaration_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DividendPayment" ADD CONSTRAINT "DividendPayment_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DividendPayment" ADD CONSTRAINT "DividendPayment_declarationId_fkey" FOREIGN KEY ("declarationId") REFERENCES "DividendDeclaration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DividendPayment" ADD CONSTRAINT "DividendPayment_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DividendPayment" ADD CONSTRAINT "DividendPayment_holdingId_fkey" FOREIGN KEY ("holdingId") REFERENCES "Holding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
