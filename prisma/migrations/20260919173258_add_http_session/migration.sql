-- CreateTable
CREATE TABLE "HttpSession" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "userId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HttpSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HttpSession_machineId_idx" ON "HttpSession"("machineId");

-- CreateIndex
CREATE UNIQUE INDEX "HttpSession_scenarioId_actorId_machineId_key" ON "HttpSession"("scenarioId", "actorId", "machineId");

-- AddForeignKey
ALTER TABLE "HttpSession" ADD CONSTRAINT "HttpSession_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Actor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HttpSession" ADD CONSTRAINT "HttpSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HttpSession" ADD CONSTRAINT "HttpSession_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HttpSession" ADD CONSTRAINT "HttpSession_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
