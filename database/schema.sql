-- ============================================================
-- Sports SaaS Platform — PostgreSQL Database Schema
-- ============================================================
-- Run with: psql -U postgres -d sports_saas -f schema.sql
-- Requires: PostgreSQL 14+
-- Extensions: pgcrypto (for gen_random_uuid)
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('ADMIN', 'GYM_OWNER', 'TRAINER', 'USER');

CREATE TYPE reservation_status AS ENUM ('CONFIRMED', 'CANCELLED', 'ATTENDED', 'NO_SHOW');

CREATE TYPE payment_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

CREATE TYPE payment_method AS ENUM ('CREDIT_CARD', 'DEBIT_CARD', 'CASH', 'BANK_TRANSFER', 'STRIPE', 'PAYPAL');

CREATE TYPE order_status AS ENUM ('PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED');

CREATE TYPE membership_status AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'PAUSED');

CREATE TYPE class_type AS ENUM ('IN_PERSON', 'ONLINE', 'HYBRID');

CREATE TYPE gym_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(150)    NOT NULL,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    password_hash   VARCHAR(255)    NOT NULL,
    role            user_role       NOT NULL DEFAULT 'USER',
    phone           VARCHAR(20),
    avatar_url      VARCHAR(500),
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    email_verified  BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role  ON users(role);

-- ============================================================
-- GYMS / SPORTS BUSINESSES
-- ============================================================

CREATE TABLE gyms (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id        UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(200)    NOT NULL,
    description     TEXT,
    address         VARCHAR(300),
    city            VARCHAR(100),
    country         VARCHAR(100)    DEFAULT 'Colombia',
    phone           VARCHAR(20),
    email           VARCHAR(255),
    logo_url        VARCHAR(500),
    website         VARCHAR(300),
    status          gym_status      NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gyms_owner_id ON gyms(owner_id);
CREATE INDEX idx_gyms_status   ON gyms(status);

-- ============================================================
-- TRAINER PROFILES
-- (A trainer has a user account with role=TRAINER,
--  plus a profile with professional info)
-- ============================================================

CREATE TABLE trainer_profiles (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    bio             TEXT,
    specialties     TEXT[],         -- e.g. {'CrossFit', 'Yoga', 'Swimming'}
    certifications  TEXT[],
    experience_years INT            DEFAULT 0,
    hourly_rate     NUMERIC(10,2),
    rating          NUMERIC(3,2)    DEFAULT 0.00,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ============================================================
-- GYM ↔ TRAINER RELATIONSHIP (M2M)
-- ============================================================

CREATE TABLE gym_trainers (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id              UUID        NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    trainer_id          UUID        NOT NULL REFERENCES trainer_profiles(id) ON DELETE CASCADE,
    can_create_classes  BOOLEAN     NOT NULL DEFAULT FALSE,
    joined_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (gym_id, trainer_id)
);

CREATE INDEX idx_gym_trainers_gym_id     ON gym_trainers(gym_id);
CREATE INDEX idx_gym_trainers_trainer_id ON gym_trainers(trainer_id);

-- ============================================================
-- CLASSES
-- ============================================================

CREATE TABLE classes (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id          UUID            NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    trainer_id      UUID            REFERENCES trainer_profiles(id) ON DELETE SET NULL,
    title           VARCHAR(200)    NOT NULL,
    description     TEXT,
    class_type      class_type      NOT NULL DEFAULT 'IN_PERSON',
    capacity        INT             NOT NULL DEFAULT 20,
    duration_min    INT             NOT NULL DEFAULT 60,   -- in minutes
    price           NUMERIC(10,2)   NOT NULL DEFAULT 0.00, -- 0 = included in membership
    scheduled_at    TIMESTAMPTZ     NOT NULL,
    location        VARCHAR(300),
    meeting_url     VARCHAR(500),                          -- for ONLINE classes
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_classes_gym_id       ON classes(gym_id);
CREATE INDEX idx_classes_trainer_id   ON classes(trainer_id);
CREATE INDEX idx_classes_scheduled_at ON classes(scheduled_at);

-- ============================================================
-- RESERVATIONS (Class Bookings)
-- ============================================================

CREATE TABLE reservations (
    id              UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id        UUID                NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    user_id         UUID                NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status          reservation_status  NOT NULL DEFAULT 'CONFIRMED',
    booked_at       TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    cancelled_at    TIMESTAMPTZ,
    notes           TEXT,
    UNIQUE (class_id, user_id)
);

CREATE INDEX idx_reservations_class_id ON reservations(class_id);
CREATE INDEX idx_reservations_user_id  ON reservations(user_id);
CREATE INDEX idx_reservations_status   ON reservations(status);

-- ============================================================
-- MEMBERSHIP PLANS
-- ============================================================

CREATE TABLE membership_plans (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id          UUID            NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    name            VARCHAR(150)    NOT NULL,
    description     TEXT,
    price           NUMERIC(10,2)   NOT NULL,
    duration_days   INT             NOT NULL,   -- e.g. 30, 90, 365
    max_classes     INT,                        -- NULL = unlimited
    includes_marketplace BOOLEAN    NOT NULL DEFAULT FALSE,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_membership_plans_gym_id ON membership_plans(gym_id);

-- ============================================================
-- USER MEMBERSHIPS (Active Subscriptions)
-- ============================================================

CREATE TABLE user_memberships (
    id              UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID                NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id         UUID                NOT NULL REFERENCES membership_plans(id) ON DELETE CASCADE,
    status          membership_status   NOT NULL DEFAULT 'ACTIVE',
    started_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ         NOT NULL,
    classes_used    INT                 NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_memberships_user_id    ON user_memberships(user_id);
CREATE INDEX idx_user_memberships_plan_id    ON user_memberships(plan_id);
CREATE INDEX idx_user_memberships_status     ON user_memberships(status);
CREATE INDEX idx_user_memberships_expires_at ON user_memberships(expires_at);

-- ============================================================
-- PAYMENTS
-- ============================================================

CREATE TABLE payments (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID            NOT NULL REFERENCES users(id),
    amount              NUMERIC(10,2)   NOT NULL,
    currency            VARCHAR(3)      NOT NULL DEFAULT 'COP',
    status              payment_status  NOT NULL DEFAULT 'PENDING',
    method              payment_method,
    gateway_tx_id       VARCHAR(255),               -- Stripe / PayPal transaction ID
    description         TEXT,
    -- Polymorphic reference: either a membership or an order
    membership_id       UUID            REFERENCES user_memberships(id),
    order_id            UUID,                       -- FK added after orders table
    paid_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status  ON payments(status);

-- ============================================================
-- PRODUCTS (Marketplace)
-- ============================================================

CREATE TABLE products (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id          UUID            NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    name            VARCHAR(200)    NOT NULL,
    description     TEXT,
    price           NUMERIC(10,2)   NOT NULL,
    stock           INT             NOT NULL DEFAULT 0,
    category        VARCHAR(100),
    image_url       VARCHAR(500),
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_gym_id   ON products(gym_id);
CREATE INDEX idx_products_category ON products(category);

-- ============================================================
-- ORDERS
-- ============================================================

CREATE TABLE orders (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL REFERENCES users(id),
    gym_id          UUID            NOT NULL REFERENCES gyms(id),
    status          order_status    NOT NULL DEFAULT 'PENDING',
    total_amount    NUMERIC(10,2)   NOT NULL DEFAULT 0.00,
    shipping_address VARCHAR(300),
    notes           TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_gym_id  ON orders(gym_id);
CREATE INDEX idx_orders_status  ON orders(status);

-- ============================================================
-- ORDER ITEMS (Line items per order)
-- ============================================================

CREATE TABLE order_items (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID            NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id      UUID            NOT NULL REFERENCES products(id),
    quantity        INT             NOT NULL DEFAULT 1,
    unit_price      NUMERIC(10,2)   NOT NULL,   -- price snapshot at purchase time
    subtotal        NUMERIC(10,2)   GENERATED ALWAYS AS (quantity * unit_price) STORED
);

CREATE INDEX idx_order_items_order_id   ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- ============================================================
-- Add FK from payments.order_id (now that orders table exists)
-- ============================================================

ALTER TABLE payments
    ADD CONSTRAINT fk_payments_order
    FOREIGN KEY (order_id) REFERENCES orders(id);

-- ============================================================
-- REFRESH TOKENS (for JWT rotation)
-- ============================================================

CREATE TABLE refresh_tokens (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked     BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_gyms_updated_at
    BEFORE UPDATE ON gyms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_trainer_profiles_updated_at
    BEFORE UPDATE ON trainer_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_classes_updated_at
    BEFORE UPDATE ON classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_membership_plans_updated_at
    BEFORE UPDATE ON membership_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- END OF SCHEMA
-- ============================================================
