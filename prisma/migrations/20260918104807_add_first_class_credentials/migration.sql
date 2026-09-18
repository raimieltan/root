-- CreateTable
CREATE TABLE "Credential" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Password',
    "origin" TEXT NOT NULL,
    "knownScope" TEXT NOT NULL,
    "serviceName" TEXT,
    "databaseName" TEXT,
    "secret" TEXT,
    "privilege" "AccessLevel" NOT NULL DEFAULT 'USER',
    "valid" BOOLEAN NOT NULL DEFAULT true,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scenarioId" TEXT NOT NULL,

    CONSTRAINT "Credential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Credential_scenarioId_idx" ON "Credential"("scenarioId");

-- CreateIndex
CREATE INDEX "Credential_scenarioId_username_knownScope_idx" ON "Credential"("scenarioId", "username", "knownScope");

-- CreateIndex
CREATE UNIQUE INDEX "Credential_scenarioId_username_knownScope_key" ON "Credential"("scenarioId", "username", "knownScope");

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
