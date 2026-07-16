/*
  Warnings:

  - You are about to drop the column `createdAt` on the `applications` table. All the data in the column will be lost.
  - You are about to drop the column `jobId` on the `applications` table. All the data in the column will be lost.
  - You are about to drop the column `resumeUrl` on the `applications` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `applications` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `applications` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `attachments` table. All the data in the column will be lost.
  - You are about to drop the column `jobId` on the `attachments` table. All the data in the column will be lost.
  - You are about to drop the column `mimeType` on the `attachments` table. All the data in the column will be lost.
  - You are about to drop the column `originalName` on the `attachments` table. All the data in the column will be lost.
  - You are about to drop the column `applicationId` on the `chat_messages` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `chat_messages` table. All the data in the column will be lost.
  - You are about to drop the column `senderId` on the `chat_messages` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `logoUrl` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `companyId` on the `jobs` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `jobs` table. All the data in the column will be lost.
  - You are about to drop the column `salaryMax` on the `jobs` table. All the data in the column will be lost.
  - You are about to drop the column `salaryMin` on the `jobs` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `jobs` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `tokenHash` on the `refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[job_id,user_id]` on the table `applications` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id]` on the table `companies` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `job_id` to the `applications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `resume_url` to the `applications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `applications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `applications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `job_id` to the `attachments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mime_type` to the `attachments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `original_name` to the `attachments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `application_id` to the `chat_messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sender_id` to the `chat_messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `companies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `companies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_id` to the `jobs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `jobs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expires_at` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `token_hash` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "applications" DROP CONSTRAINT "applications_jobId_fkey";

-- DropForeignKey
ALTER TABLE "applications" DROP CONSTRAINT "applications_userId_fkey";

-- DropForeignKey
ALTER TABLE "attachments" DROP CONSTRAINT "attachments_jobId_fkey";

-- DropForeignKey
ALTER TABLE "chat_messages" DROP CONSTRAINT "chat_messages_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "chat_messages" DROP CONSTRAINT "chat_messages_senderId_fkey";

-- DropForeignKey
ALTER TABLE "companies" DROP CONSTRAINT "companies_userId_fkey";

-- DropForeignKey
ALTER TABLE "jobs" DROP CONSTRAINT "jobs_companyId_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_userId_fkey";

-- DropForeignKey
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_userId_fkey";

-- DropIndex
DROP INDEX "applications_jobId_idx";

-- DropIndex
DROP INDEX "applications_jobId_userId_key";

-- DropIndex
DROP INDEX "applications_userId_idx";

-- DropIndex
DROP INDEX "attachments_jobId_idx";

-- DropIndex
DROP INDEX "chat_messages_applicationId_createdAt_idx";

-- DropIndex
DROP INDEX "companies_userId_key";

-- DropIndex
DROP INDEX "jobs_companyId_idx";

-- DropIndex
DROP INDEX "jobs_salaryMin_salaryMax_idx";

-- DropIndex
DROP INDEX "notifications_userId_read_idx";

-- DropIndex
DROP INDEX "refresh_tokens_userId_idx";

-- AlterTable
ALTER TABLE "applications" DROP COLUMN "createdAt",
DROP COLUMN "jobId",
DROP COLUMN "resumeUrl",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "job_id" BIGINT NOT NULL,
ADD COLUMN     "resume_url" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_id" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "attachments" DROP COLUMN "createdAt",
DROP COLUMN "jobId",
DROP COLUMN "mimeType",
DROP COLUMN "originalName",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "job_id" BIGINT NOT NULL,
ADD COLUMN     "mime_type" TEXT NOT NULL,
ADD COLUMN     "original_name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "chat_messages" DROP COLUMN "applicationId",
DROP COLUMN "createdAt",
DROP COLUMN "senderId",
ADD COLUMN     "application_id" BIGINT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "sender_id" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "companies" DROP COLUMN "createdAt",
DROP COLUMN "logoUrl",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "logo_url" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_id" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "jobs" DROP COLUMN "companyId",
DROP COLUMN "createdAt",
DROP COLUMN "salaryMax",
DROP COLUMN "salaryMin",
DROP COLUMN "updatedAt",
ADD COLUMN     "company_id" BIGINT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "salary_max" INTEGER,
ADD COLUMN     "salary_min" INTEGER,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "createdAt",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "user_id" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "refresh_tokens" DROP COLUMN "createdAt",
DROP COLUMN "expiresAt",
DROP COLUMN "tokenHash",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expires_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "token_hash" TEXT NOT NULL,
ADD COLUMN     "user_id" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "applications_job_id_idx" ON "applications"("job_id");

-- CreateIndex
CREATE INDEX "applications_user_id_idx" ON "applications"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "applications_job_id_user_id_key" ON "applications"("job_id", "user_id");

-- CreateIndex
CREATE INDEX "attachments_job_id_idx" ON "attachments"("job_id");

-- CreateIndex
CREATE INDEX "chat_messages_application_id_created_at_idx" ON "chat_messages"("application_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "companies_user_id_key" ON "companies"("user_id");

-- CreateIndex
CREATE INDEX "jobs_company_id_idx" ON "jobs"("company_id");

-- CreateIndex
CREATE INDEX "jobs_salary_min_salary_max_idx" ON "jobs"("salary_min", "salary_max");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_idx" ON "notifications"("user_id", "read");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
