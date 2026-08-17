-- Accounts that sign in with LinkedIn have no password, and are matched on the
-- OpenID Connect subject identifier LinkedIn issues for this application.

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "linkedinId" TEXT,
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_linkedinId_key" ON "User"("linkedinId");
