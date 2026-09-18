-- CreateEnum
CREATE TYPE "SessionContext" AS ENUM ('UNIX', 'SSH', 'POSTGRES');

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "context" "SessionContext" NOT NULL DEFAULT 'UNIX',
ADD COLUMN     "databaseName" TEXT,
ADD COLUMN     "serviceName" TEXT;
