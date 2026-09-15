/*
  Warnings:

  - A unique constraint covering the columns `[idempotencyKey]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `idempotencyKey` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `method` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('ACH', 'CARD', 'GOOGLE_PAY', 'APPLE_PAY', 'PAYPAL', 'VENMO');

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "idempotencyKey" TEXT NOT NULL,
ADD COLUMN     "method" "PaymentMethod" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "payments_idempotencyKey_key" ON "payments"("idempotencyKey");

-- CreateIndex
CREATE INDEX "payments_provider_idx" ON "payments"("provider");

-- CreateIndex
CREATE INDEX "payments_method_idx" ON "payments"("method");
