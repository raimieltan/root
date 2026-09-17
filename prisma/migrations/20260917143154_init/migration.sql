-- CreateEnum
CREATE TYPE "NetworkZone" AS ENUM ('EXTERNAL', 'DMZ', 'INTERNAL', 'FINANCE');

-- CreateEnum
CREATE TYPE "AccessLevel" AS ENUM ('NONE', 'GUEST', 'USER', 'SERVICE', 'ADMIN', 'ROOT');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('RUNNING', 'STOPPED');

-- CreateEnum
CREATE TYPE "SecurityEventCategory" AS ENUM ('NETWORK', 'AUTH', 'PROCESS', 'FILESYSTEM', 'WEB', 'PRIVILEGE', 'PERSISTENCE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "SecurityEventSeverity" AS ENUM ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ScenarioMode" AS ENUM ('RED', 'BLUE');

-- CreateEnum
CREATE TYPE "ScenarioState" AS ENUM ('SETUP', 'ACTIVE', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL,
    "mode" "ScenarioMode" NOT NULL,
    "state" "ScenarioState" NOT NULL DEFAULT 'SETUP',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "Scenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Actor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,

    CONSTRAINT "Actor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Machine" (
    "id" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "zone" "NetworkZone" NOT NULL,
    "os" TEXT NOT NULL,

    CONSTRAINT "Machine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "password" TEXT,
    "groups" TEXT[],
    "privilege" "AccessLevel" NOT NULL DEFAULT 'USER',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "protocol" TEXT NOT NULL,
    "runningAsUser" TEXT NOT NULL,
    "status" "ServiceStatus" NOT NULL DEFAULT 'RUNNING',
    "machineId" TEXT NOT NULL,
    "exposedZones" TEXT[],
    "metadata" TEXT,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "group" TEXT,
    "contents" TEXT,
    "machineId" TEXT NOT NULL,
    "permissions" TEXT NOT NULL,
    "isSecret" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Process" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pid" INTEGER NOT NULL,
    "runningAs" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Process_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "userId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "privilege" "AccessLevel" NOT NULL,
    "sourceMachineId" TEXT,
    "scenarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkConnection" (
    "id" TEXT NOT NULL,
    "sourceMachineId" TEXT NOT NULL,
    "targetMachineId" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "protocol" TEXT NOT NULL,
    "allowed" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NetworkConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkRule" (
    "id" TEXT NOT NULL,
    "sourceZone" TEXT NOT NULL,
    "targetMachineId" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "allow" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NetworkRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityEvent" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT,
    "sourceMachineId" TEXT,
    "targetMachineId" TEXT,
    "userId" TEXT,
    "scenarioId" TEXT NOT NULL,
    "category" "SecurityEventCategory" NOT NULL,
    "action" TEXT NOT NULL,
    "visibleToRed" BOOLEAN NOT NULL DEFAULT true,
    "visibleToBlue" BOOLEAN NOT NULL DEFAULT true,
    "visibleInReplay" BOOLEAN NOT NULL DEFAULT true,
    "severity" "SecurityEventSeverity" NOT NULL,
    "metadata" TEXT,

    CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Persistence" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "beaconIntervalSeconds" INTEGER NOT NULL DEFAULT 30,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "hasProcess" BOOLEAN NOT NULL DEFAULT true,
    "hasStartupEntry" BOOLEAN NOT NULL DEFAULT true,
    "hasOutboundConnection" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Persistence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Actor_scenarioId_idx" ON "Actor"("scenarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Machine_hostname_key" ON "Machine"("hostname");

-- CreateIndex
CREATE UNIQUE INDEX "Machine_ip_key" ON "Machine"("ip");

-- CreateIndex
CREATE INDEX "User_machineId_idx" ON "User"("machineId");

-- CreateIndex
CREATE UNIQUE INDEX "User_machineId_username_key" ON "User"("machineId", "username");

-- CreateIndex
CREATE INDEX "Service_machineId_idx" ON "Service"("machineId");

-- CreateIndex
CREATE INDEX "File_machineId_idx" ON "File"("machineId");

-- CreateIndex
CREATE UNIQUE INDEX "File_machineId_path_key" ON "File"("machineId", "path");

-- CreateIndex
CREATE INDEX "Process_machineId_idx" ON "Process"("machineId");

-- CreateIndex
CREATE INDEX "Session_machineId_idx" ON "Session"("machineId");

-- CreateIndex
CREATE INDEX "Session_actorId_idx" ON "Session"("actorId");

-- CreateIndex
CREATE INDEX "Session_scenarioId_idx" ON "Session"("scenarioId");

-- CreateIndex
CREATE INDEX "NetworkConnection_targetMachineId_idx" ON "NetworkConnection"("targetMachineId");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkConnection_sourceMachineId_targetMachineId_port_key" ON "NetworkConnection"("sourceMachineId", "targetMachineId", "port");

-- CreateIndex
CREATE INDEX "NetworkRule_targetMachineId_idx" ON "NetworkRule"("targetMachineId");

-- CreateIndex
CREATE INDEX "SecurityEvent_scenarioId_idx" ON "SecurityEvent"("scenarioId");

-- CreateIndex
CREATE INDEX "SecurityEvent_sourceMachineId_idx" ON "SecurityEvent"("sourceMachineId");

-- CreateIndex
CREATE INDEX "SecurityEvent_targetMachineId_idx" ON "SecurityEvent"("targetMachineId");

-- CreateIndex
CREATE INDEX "Persistence_machineId_idx" ON "Persistence"("machineId");

-- AddForeignKey
ALTER TABLE "Actor" ADD CONSTRAINT "Actor_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Process" ADD CONSTRAINT "Process_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Actor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkConnection" ADD CONSTRAINT "NetworkConnection_sourceMachineId_fkey" FOREIGN KEY ("sourceMachineId") REFERENCES "Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkConnection" ADD CONSTRAINT "NetworkConnection_targetMachineId_fkey" FOREIGN KEY ("targetMachineId") REFERENCES "Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkRule" ADD CONSTRAINT "NetworkRule_targetMachineId_fkey" FOREIGN KEY ("targetMachineId") REFERENCES "Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityEvent" ADD CONSTRAINT "SecurityEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Actor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityEvent" ADD CONSTRAINT "SecurityEvent_sourceMachineId_fkey" FOREIGN KEY ("sourceMachineId") REFERENCES "Machine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityEvent" ADD CONSTRAINT "SecurityEvent_targetMachineId_fkey" FOREIGN KEY ("targetMachineId") REFERENCES "Machine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityEvent" ADD CONSTRAINT "SecurityEvent_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Persistence" ADD CONSTRAINT "Persistence_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
