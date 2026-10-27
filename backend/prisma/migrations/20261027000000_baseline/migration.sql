-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'GYM_OWNER', 'TRAINER', 'USER');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('CONFIRMED', 'CANCELLED', 'ATTENDED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CREDIT_CARD', 'DEBIT_CARD', 'CASH', 'BANK_TRANSFER', 'STRIPE', 'PAYPAL');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'PAUSED');

-- CreateEnum
CREATE TYPE "ClassType" AS ENUM ('IN_PERSON', 'ONLINE', 'HYBRID');

-- CreateEnum
CREATE TYPE "GymLocationSource" AS ENUM ('MANUAL', 'EXACT', 'APPROXIMATE');

-- CreateEnum
CREATE TYPE "GymStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('PERSONAL_TRAINING', 'NUTRITION_PLAN', 'PHYSIOTHERAPY', 'CONSULTATION');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('TOURNAMENT', 'MASTERCLASS', 'WORKSHOP', 'RETREAT', 'CROSSFIT', 'WEIGHTLIFTING', 'OTHER');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('EMAIL', 'PUSH', 'SMS');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'VOID');

-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DealType" AS ENUM ('EVENT_SPONSORSHIP', 'GYM_BRANDING', 'PRODUCT_PLACEMENT', 'ATHLETE_ENDORSEMENT');

-- CreateEnum
CREATE TYPE "DealStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('GENERAL', 'PAYMENT', 'CLASS', 'INSTRUCTOR', 'FACILITY', 'OTHER');

-- CreateEnum
CREATE TYPE "HealthMetricType" AS ENUM ('WEIGHT', 'STEPS', 'WATER', 'CALORIES_BURNED', 'CALORIES_INTAKE', 'SLEEP_HOURS', 'DISTANCE');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "auth0_id" VARCHAR(255),
    "name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255),
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "phone" VARCHAR(20),
    "dni" VARCHAR(50),
    "avatar_url" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "weight" DOUBLE PRECISION DEFAULT 70,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gyms" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "address" VARCHAR(300),
    "city" VARCHAR(100),
    "district" VARCHAR(100),
    "province" VARCHAR(100),
    "country" VARCHAR(100) DEFAULT 'Colombia',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "location_source" "GymLocationSource",
    "phone" VARCHAR(20),
    "email" VARCHAR(255),
    "logo_url" TEXT,
    "website" VARCHAR(300),
    "open_time" VARCHAR(20) DEFAULT '06:00 AM',
    "close_time" VARCHAR(20) DEFAULT '10:00 PM',
    "open_days" VARCHAR(100) DEFAULT 'Lunes a Sábado',
    "status" "GymStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gyms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trainer_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "bio" TEXT,
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "experience_years" INTEGER NOT NULL DEFAULT 0,
    "hourly_rate" DECIMAL(10,2),
    "rating" DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trainer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gym_trainers" (
    "id" TEXT NOT NULL,
    "gym_id" TEXT NOT NULL,
    "trainer_id" TEXT NOT NULL,
    "can_create_classes" BOOLEAN NOT NULL DEFAULT false,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gym_trainers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL,
    "gym_id" TEXT NOT NULL,
    "trainer_id" TEXT,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "class_type" "ClassType" NOT NULL DEFAULT 'IN_PERSON',
    "capacity" INTEGER NOT NULL DEFAULT 20,
    "duration_min" INTEGER NOT NULL DEFAULT 60,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "location" VARCHAR(300),
    "meeting_url" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'CONFIRMED',
    "booked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelled_at" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_plans" (
    "id" TEXT NOT NULL,
    "gym_id" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "duration_days" INTEGER NOT NULL,
    "max_classes" INTEGER,
    "includes_marketplace" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membership_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_memberships" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "classes_used" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'COP',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "method" "PaymentMethod",
    "gateway_tx_id" VARCHAR(255),
    "description" TEXT,
    "membership_id" TEXT,
    "order_id" TEXT,
    "class_id" TEXT,
    "service_id" TEXT,
    "booking_notes" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "gym_id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "category" VARCHAR(100),
    "image_url" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "gym_id" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "total_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "shipping_address" VARCHAR(300),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_schedules" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "open_minute" INTEGER NOT NULL,
    "close_minute" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "provider_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_services" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "service_type" "ServiceType" NOT NULL DEFAULT 'PERSONAL_TRAINING',
    "duration_min" INTEGER NOT NULL DEFAULT 60,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "professional_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_bookings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "booked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "booking_date" VARCHAR(10),
    "start_minute" INTEGER,
    "end_minute" INTEGER,

    CONSTRAINT "professional_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "organizer_id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "event_type" "EventType" NOT NULL DEFAULT 'TOURNAMENT',
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "date" TIMESTAMP(3) NOT NULL,
    "location" VARCHAR(300),
    "capacity" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wearable_metrics" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "deviceType" VARCHAR(100) NOT NULL,
    "steps" INTEGER NOT NULL DEFAULT 0,
    "heart_rate_avg" INTEGER,
    "calories" INTEGER NOT NULL DEFAULT 0,
    "date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wearable_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_campaigns" (
    "id" TEXT NOT NULL,
    "gym_id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "subject" VARCHAR(200),
    "content" TEXT NOT NULL,
    "type" "CampaignType" NOT NULL DEFAULT 'EMAIL',
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "scheduled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "gym_id" TEXT,
    "invoice_num" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "tax" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "total" DECIMAL(10,2) NOT NULL,
    "pdf_url" VARCHAR(500),
    "status" "InvoiceStatus" NOT NULL DEFAULT 'ISSUED',
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wearable_connections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "token_expiry" TIMESTAMP(3),
    "fitbit_user_id" VARCHAR(100),
    "scope" VARCHAR(300),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wearable_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_notes" (
    "id" TEXT NOT NULL,
    "gym_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_applications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "gym_id" TEXT,
    "business_name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "status" "VendorStatus" NOT NULL DEFAULT 'PENDING',
    "review_note" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sponsors" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "logo_url" VARCHAR(500),
    "website" VARCHAR(300),
    "contact_email" VARCHAR(255),
    "industry" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sponsors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sponsorship_deals" (
    "id" TEXT NOT NULL,
    "sponsor_id" TEXT NOT NULL,
    "gym_id" TEXT,
    "event_id" TEXT,
    "deal_type" "DealType" NOT NULL DEFAULT 'EVENT_SPONSORSHIP',
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "status" "DealStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sponsorship_deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "gym_id" TEXT,
    "subject" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "category" "TicketCategory" NOT NULL DEFAULT 'GENERAL',
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "admin_reply" TEXT,
    "replied_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_metrics" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "HealthMetricType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" VARCHAR(20) NOT NULL,
    "date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL,
    "gym_id" TEXT,
    "token" VARCHAR(255) NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "invited_by_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_met_configs" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "met_value" DOUBLE PRECISION NOT NULL,
    "intensity" VARCHAR(50) NOT NULL,
    "default_duration" INTEGER NOT NULL DEFAULT 60,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_met_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_goals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "target_calories" INTEGER NOT NULL DEFAULT 600,
    "target_steps" INTEGER NOT NULL DEFAULT 10000,
    "target_water" INTEGER NOT NULL DEFAULT 8,
    "target_weight" DOUBLE PRECISION,

    CONSTRAINT "user_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_recommendations" (
    "id" TEXT NOT NULL,
    "coach_id" TEXT NOT NULL,
    "athlete_id" TEXT NOT NULL,
    "observation" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coach_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "requested_role" "UserRole" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "admin_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "actor_role" VARCHAR(30) NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "entity" VARCHAR(50) NOT NULL,
    "entity_id" TEXT,
    "gym_id" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_auth0_id_key" ON "users"("auth0_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "gyms_owner_id_idx" ON "gyms"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "trainer_profiles_user_id_key" ON "trainer_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "gym_trainers_gym_id_trainer_id_key" ON "gym_trainers"("gym_id", "trainer_id");

-- CreateIndex
CREATE INDEX "classes_gym_id_scheduled_at_idx" ON "classes"("gym_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "classes_trainer_id_idx" ON "classes"("trainer_id");

-- CreateIndex
CREATE INDEX "reservations_user_id_idx" ON "reservations"("user_id");

-- CreateIndex
CREATE INDEX "reservations_status_idx" ON "reservations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "reservations_class_id_user_id_key" ON "reservations"("class_id", "user_id");

-- CreateIndex
CREATE INDEX "membership_plans_gym_id_idx" ON "membership_plans"("gym_id");

-- CreateIndex
CREATE INDEX "user_memberships_user_id_status_idx" ON "user_memberships"("user_id", "status");

-- CreateIndex
CREATE INDEX "user_memberships_plan_id_idx" ON "user_memberships"("plan_id");

-- CreateIndex
CREATE INDEX "payments_user_id_idx" ON "payments"("user_id");

-- CreateIndex
CREATE INDEX "payments_status_paid_at_idx" ON "payments"("status", "paid_at");

-- CreateIndex
CREATE INDEX "payments_order_id_idx" ON "payments"("order_id");

-- CreateIndex
CREATE INDEX "payments_membership_id_idx" ON "payments"("membership_id");

-- CreateIndex
CREATE INDEX "payments_class_id_idx" ON "payments"("class_id");

-- CreateIndex
CREATE INDEX "payments_service_id_idx" ON "payments"("service_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "provider_schedules_provider_id_day_of_week_key" ON "provider_schedules"("provider_id", "day_of_week");

-- CreateIndex
CREATE UNIQUE INDEX "wearable_metrics_user_id_date_key" ON "wearable_metrics"("user_id", "date");

-- CreateIndex
CREATE INDEX "marketing_campaigns_gym_id_idx" ON "marketing_campaigns"("gym_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_payment_id_key" ON "invoices"("payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_num_key" ON "invoices"("invoice_num");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE UNIQUE INDEX "wearable_connections_user_id_provider_key" ON "wearable_connections"("user_id", "provider");

-- CreateIndex
CREATE INDEX "crm_notes_gym_id_user_id_idx" ON "crm_notes"("gym_id", "user_id");

-- CreateIndex
CREATE INDEX "vendor_applications_user_id_idx" ON "vendor_applications"("user_id");

-- CreateIndex
CREATE INDEX "vendor_applications_status_idx" ON "vendor_applications"("status");

-- CreateIndex
CREATE INDEX "sponsorship_deals_sponsor_id_idx" ON "sponsorship_deals"("sponsor_id");

-- CreateIndex
CREATE INDEX "sponsorship_deals_status_idx" ON "sponsorship_deals"("status");

-- CreateIndex
CREATE INDEX "support_tickets_user_id_idx" ON "support_tickets"("user_id");

-- CreateIndex
CREATE INDEX "support_tickets_status_idx" ON "support_tickets"("status");

-- CreateIndex
CREATE INDEX "health_metrics_user_id_date_idx" ON "health_metrics"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "health_metrics_user_id_date_type_key" ON "health_metrics"("user_id", "date", "type");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_email_key" ON "invitations"("email");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_key" ON "invitations"("token");

-- CreateIndex
CREATE UNIQUE INDEX "activity_met_configs_name_key" ON "activity_met_configs"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_goals_user_id_key" ON "user_goals"("user_id");

-- CreateIndex
CREATE INDEX "coach_recommendations_athlete_id_idx" ON "coach_recommendations"("athlete_id");

-- CreateIndex
CREATE INDEX "coach_recommendations_coach_id_idx" ON "coach_recommendations"("coach_id");

-- CreateIndex
CREATE INDEX "role_requests_user_id_idx" ON "role_requests"("user_id");

-- CreateIndex
CREATE INDEX "role_requests_status_idx" ON "role_requests"("status");

-- CreateIndex
CREATE INDEX "audit_logs_gym_id_created_at_idx" ON "audit_logs"("gym_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at");

-- AddForeignKey
ALTER TABLE "gyms" ADD CONSTRAINT "gyms_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainer_profiles" ADD CONSTRAINT "trainer_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gym_trainers" ADD CONSTRAINT "gym_trainers_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gym_trainers" ADD CONSTRAINT "gym_trainers_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "trainer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "trainer_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_plans" ADD CONSTRAINT "membership_plans_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_memberships" ADD CONSTRAINT "user_memberships_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "membership_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_memberships" ADD CONSTRAINT "user_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "user_memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_schedules" ADD CONSTRAINT "provider_schedules_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_services" ADD CONSTRAINT "professional_services_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_bookings" ADD CONSTRAINT "professional_bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_bookings" ADD CONSTRAINT "professional_bookings_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "professional_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wearable_metrics" ADD CONSTRAINT "wearable_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_campaigns" ADD CONSTRAINT "marketing_campaigns_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wearable_connections" ADD CONSTRAINT "wearable_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_notes" ADD CONSTRAINT "crm_notes_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_notes" ADD CONSTRAINT "crm_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_notes" ADD CONSTRAINT "crm_notes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_applications" ADD CONSTRAINT "vendor_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_applications" ADD CONSTRAINT "vendor_applications_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsorship_deals" ADD CONSTRAINT "sponsorship_deals_sponsor_id_fkey" FOREIGN KEY ("sponsor_id") REFERENCES "sponsors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsorship_deals" ADD CONSTRAINT "sponsorship_deals_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsorship_deals" ADD CONSTRAINT "sponsorship_deals_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_metrics" ADD CONSTRAINT "health_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_goals" ADD CONSTRAINT "user_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_recommendations" ADD CONSTRAINT "coach_recommendations_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_recommendations" ADD CONSTRAINT "coach_recommendations_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_requests" ADD CONSTRAINT "role_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

