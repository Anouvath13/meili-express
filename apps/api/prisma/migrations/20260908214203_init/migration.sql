-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'suspended', 'pending_review');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('received_from_china', 'in_transit', 'arrived_lao_warehouse', 'arrived_branch', 'priced_awaiting_payment', 'paid_awaiting_pickup', 'delivered');

-- CreateEnum
CREATE TYPE "PointsSource" AS ENUM ('transport', 'referral', 'redemption', 'expiry_reset');

-- CreateEnum
CREATE TYPE "PointsStatus" AS ENUM ('locked', 'unlocked');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('pending', 'unlocked', 'flagged');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('pending', 'approved', 'hidden');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('admin', 'staff');

-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('active', 'suspended');

-- CreateTable
CREATE TABLE "system_config" (
    "config_key" TEXT NOT NULL,
    "config_value" TEXT NOT NULL,
    "description" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("config_key")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "password_hash" TEXT,
    "full_name" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "device_fingerprint_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipments" (
    "id" TEXT NOT NULL,
    "bill_number" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "origin" TEXT,
    "destination" TEXT,
    "weight_kg" DECIMAL(8,2),
    "product_type" TEXT,
    "price" DECIMAL(10,2),
    "status" "ShipmentStatus" NOT NULL DEFAULT 'received_from_china',
    "received_date" DATE,
    "estimated_delivery" DATE,
    "actual_delivery" DATE,
    "assigned_staff_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_tracking_history" (
    "id" TEXT NOT NULL,
    "shipment_id" TEXT NOT NULL,
    "status" "ShipmentStatus" NOT NULL,
    "location" TEXT,
    "note" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_by" TEXT,

    CONSTRAINT "shipment_tracking_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "points_ledger" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "shipment_id" TEXT,
    "reference_id" TEXT,
    "delta" INTEGER NOT NULL,
    "source" "PointsSource" NOT NULL,
    "status" "PointsStatus" NOT NULL,
    "expires_at" DATE,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "points_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" TEXT NOT NULL,
    "referrer_id" TEXT NOT NULL,
    "referee_id" TEXT NOT NULL,
    "linked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referrer_bonus_credited_at" TIMESTAMP(3),
    "referee_unlock_at" TIMESTAMP(3),
    "cumulative_kg" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "status" "ReferralStatus" NOT NULL DEFAULT 'pending',
    "fraud_flag" BOOLEAN NOT NULL DEFAULT false,
    "fraud_reason" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_flags" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "fraud_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL DEFAULT 'staff',
    "status" "StaffStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_reset_log" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performed_by" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_reset_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_categories" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name_lo" TEXT NOT NULL,
    "name_zh" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,

    CONSTRAINT "news_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_articles" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "title_lo" TEXT NOT NULL,
    "title_zh" TEXT NOT NULL,
    "title_en" TEXT NOT NULL,
    "body_lo" TEXT NOT NULL,
    "body_zh" TEXT NOT NULL,
    "body_en" TEXT NOT NULL,
    "cover_image_url" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "news_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq_categories" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name_lo" TEXT NOT NULL,
    "name_zh" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "faq_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq_items" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "question_lo" TEXT NOT NULL,
    "question_zh" TEXT NOT NULL,
    "question_en" TEXT NOT NULL,
    "answer_lo" TEXT NOT NULL,
    "answer_zh" TEXT NOT NULL,
    "answer_en" TEXT NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "needs_review" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "faq_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "user_id" TEXT,
    "stars" INTEGER NOT NULL,
    "quote_lo" TEXT,
    "quote_zh" TEXT,
    "quote_en" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "name_lo" TEXT NOT NULL,
    "name_zh" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "role_lo" TEXT NOT NULL,
    "role_zh" TEXT NOT NULL,
    "role_en" TEXT NOT NULL,
    "photo_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_rates" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name_lo" TEXT NOT NULL,
    "name_zh" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "shipping_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "user_id" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" TEXT NOT NULL,
    "template_key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body_web" TEXT NOT NULL,
    "body_whatsapp" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "template_key" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "payload" JSONB,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_account_id_key" ON "users"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_bill_number_key" ON "shipments"("bill_number");

-- CreateIndex
CREATE INDEX "shipments_user_id_idx" ON "shipments"("user_id");

-- CreateIndex
CREATE INDEX "shipments_status_idx" ON "shipments"("status");

-- CreateIndex
CREATE INDEX "shipment_tracking_history_shipment_id_idx" ON "shipment_tracking_history"("shipment_id");

-- CreateIndex
CREATE INDEX "points_ledger_user_id_status_idx" ON "points_ledger"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "referrals_referee_id_key" ON "referrals"("referee_id");

-- CreateIndex
CREATE INDEX "referrals_referrer_id_idx" ON "referrals"("referrer_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_phone_key" ON "staff"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "news_categories_key_key" ON "news_categories"("key");

-- CreateIndex
CREATE INDEX "news_articles_category_id_idx" ON "news_articles"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "faq_categories_key_key" ON "faq_categories"("key");

-- CreateIndex
CREATE INDEX "faq_items_category_id_idx" ON "faq_items"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "shipping_rates_key_key" ON "shipping_rates"("key");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_template_key_key" ON "notification_templates"("template_key");

-- CreateIndex
CREATE INDEX "notification_logs_user_id_idx" ON "notification_logs"("user_id");

-- AddForeignKey
ALTER TABLE "system_config" ADD CONSTRAINT "system_config_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_assigned_staff_id_fkey" FOREIGN KEY ("assigned_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_tracking_history" ADD CONSTRAINT "shipment_tracking_history_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_tracking_history" ADD CONSTRAINT "shipment_tracking_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_reference_id_fkey" FOREIGN KEY ("reference_id") REFERENCES "referrals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referee_id_fkey" FOREIGN KEY ("referee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fraud_flags" ADD CONSTRAINT "fraud_flags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fraud_flags" ADD CONSTRAINT "fraud_flags_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_reset_log" ADD CONSTRAINT "staff_reset_log_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_reset_log" ADD CONSTRAINT "staff_reset_log_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_articles" ADD CONSTRAINT "news_articles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "news_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_articles" ADD CONSTRAINT "news_articles_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faq_items" ADD CONSTRAINT "faq_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "faq_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faq_items" ADD CONSTRAINT "faq_items_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipping_rates" ADD CONSTRAINT "shipping_rates_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
