-- AlterTable: Add device tracking columns to refresh_tokens
ALTER TABLE "refresh_tokens" 
  ADD COLUMN "device_id" VARCHAR(255),
  ADD COLUMN "user_agent" TEXT,
  ADD COLUMN "ip_address" VARCHAR(45);

-- CreateIndex for efficient cleanup queries
CREATE INDEX "refresh_tokens_user_id_expires_at_idx" ON "refresh_tokens"("user_id", "expires_at");
CREATE INDEX "refresh_tokens_user_id_device_id_idx" ON "refresh_tokens"("user_id", "device_id");
