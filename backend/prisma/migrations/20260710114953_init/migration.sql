/*
  Warnings:

  - You are about to drop the column `currentWorth` on the `Portfolio` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Portfolio` table. All the data in the column will be lost.
  - Added the required column `name` to the `Portfolio` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Portfolio" DROP COLUMN "currentWorth",
DROP COLUMN "title",
ADD COLUMN     "name" TEXT NOT NULL;
