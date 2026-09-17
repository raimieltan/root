/*
  Warnings:

  - A unique constraint covering the columns `[scenarioId,hostname]` on the table `Machine` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[scenarioId,ip]` on the table `Machine` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `scenarioId` to the `Machine` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Machine_hostname_key";

-- DropIndex
DROP INDEX "Machine_ip_key";

-- AlterTable
ALTER TABLE "Machine" ADD COLUMN     "scenarioId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Machine_scenarioId_idx" ON "Machine"("scenarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Machine_scenarioId_hostname_key" ON "Machine"("scenarioId", "hostname");

-- CreateIndex
CREATE UNIQUE INDEX "Machine_scenarioId_ip_key" ON "Machine"("scenarioId", "ip");

-- AddForeignKey
ALTER TABLE "Machine" ADD CONSTRAINT "Machine_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
