-- ============================================================
-- Sports SaaS Platform — Seed Data (Development)
-- ============================================================
-- Run AFTER schema.sql:
-- psql -U postgres -d sports_saas -f seed.sql
-- ============================================================

-- Passwords below are hashed with bcrypt (cost 10)
-- Plain text for dev: "Password123!"

-- ============================================================
-- USERS
-- ============================================================

INSERT INTO users (id, name, email, password_hash, role, phone, is_active, email_verified) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'Admin Principal',
    'admin@sportssaas.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Password123!
    'ADMIN', '+573001000001', TRUE, TRUE
),
(
    '00000000-0000-0000-0000-000000000002',
    'Carlos Gimnasio',
    'carlos@gympower.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'GYM_OWNER', '+573001000002', TRUE, TRUE
),
(
    '00000000-0000-0000-0000-000000000003',
    'Laura Entrenadora',
    'laura@trainer.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'TRAINER', '+573001000003', TRUE, TRUE
),
(
    '00000000-0000-0000-0000-000000000004',
    'Juan Usuario',
    'juan@user.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'USER', '+573001000004', TRUE, TRUE
),
(
    '00000000-0000-0000-0000-000000000005',
    'Maria Usuario',
    'maria@user.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'USER', '+573001000005', TRUE, TRUE
);

-- ============================================================
-- GYMS
-- ============================================================

INSERT INTO gyms (id, owner_id, name, description, address, city, country, phone, email, status) VALUES
(
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000002',
    'GymPower Medellín',
    'El mejor gimnasio de alto rendimiento en Medellín. Equipos de última generación y entrenadores certificados.',
    'Cra 43A #19-17, El Poblado',
    'Medellín',
    'Colombia',
    '+5744441000',
    'info@gympower.com',
    'ACTIVE'
),
(
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000002',
    'AquaSport Club',
    'Academia de natación y deportes acuáticos para todas las edades.',
    'Calle 10 #43-150, Laureles',
    'Medellín',
    'Colombia',
    '+5744442000',
    'info@aquasport.com',
    'ACTIVE'
);

-- ============================================================
-- TRAINER PROFILES
-- ============================================================

INSERT INTO trainer_profiles (id, user_id, bio, specialties, certifications, experience_years, hourly_rate, rating) VALUES
(
    '00000000-0000-0000-0000-000000000020',
    '00000000-0000-0000-0000-000000000003',
    'Entrenadora personal certificada con 8 años de experiencia en CrossFit y Yoga.',
    ARRAY['CrossFit', 'Yoga', 'Functional Training'],
    ARRAY['CrossFit Level 2', 'Yoga Alliance RYT 200', 'NASM-CPT'],
    8,
    80000.00,
    4.80
);

-- ============================================================
-- GYM_TRAINERS (Assignments)
-- ============================================================

INSERT INTO gym_trainers (gym_id, trainer_id, can_create_classes) VALUES
(
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000020',
    TRUE
);

-- ============================================================
-- CLASSES
-- ============================================================

INSERT INTO classes (id, gym_id, trainer_id, title, description, class_type, capacity, duration_min, price, scheduled_at, location) VALUES
(
    '00000000-0000-0000-0000-000000000030',
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000020',
    'CrossFit Avanzado',
    'Clase de CrossFit de alta intensidad para deportistas con experiencia.',
    'IN_PERSON', 15, 60, 25000.00,
    NOW() + INTERVAL '1 day',
    'Salón Principal - GymPower'
),
(
    '00000000-0000-0000-0000-000000000031',
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000020',
    'Yoga Matutino',
    'Sesión de yoga relajante para comenzar el día con energía y equilibrio.',
    'IN_PERSON', 20, 75, 20000.00,
    NOW() + INTERVAL '2 days',
    'Salón de Yoga - GymPower'
),
(
    '00000000-0000-0000-0000-000000000032',
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000020',
    'Entrenamiento Funcional Online',
    'Clase online de entrenamiento funcional. Solo necesitas espacio y colchoneta.',
    'ONLINE', 30, 45, 15000.00,
    NOW() + INTERVAL '3 days',
    NULL
);

-- ============================================================
-- MEMBERSHIP PLANS
-- ============================================================

INSERT INTO membership_plans (id, gym_id, name, description, price, duration_days, max_classes, includes_marketplace) VALUES
(
    '00000000-0000-0000-0000-000000000040',
    '00000000-0000-0000-0000-000000000010',
    'Plan Básico',
    'Acceso a 8 clases por mes.',
    120000.00, 30, 8, FALSE
),
(
    '00000000-0000-0000-0000-000000000041',
    '00000000-0000-0000-0000-000000000010',
    'Plan Estándar',
    'Acceso ilimitado a clases + 10% descuento en tienda.',
    220000.00, 30, NULL, TRUE
),
(
    '00000000-0000-0000-0000-000000000042',
    '00000000-0000-0000-0000-000000000010',
    'Plan Anual VIP',
    'Acceso ilimitado + entrenamiento personal mensual + acceso a marketplace.',
    1800000.00, 365, NULL, TRUE
);

-- ============================================================
-- PRODUCTS (Marketplace)
-- ============================================================

INSERT INTO products (id, gym_id, name, description, price, stock, category) VALUES
(
    '00000000-0000-0000-0000-000000000050',
    '00000000-0000-0000-0000-000000000010',
    'Guantes de CrossFit Pro',
    'Guantes profesionales con grip reforzado. Tallas S, M, L, XL.',
    85000.00, 50, 'Accesorios'
),
(
    '00000000-0000-0000-0000-000000000051',
    '00000000-0000-0000-0000-000000000010',
    'Proteína Whey Premium 1kg',
    'Proteína de suero de leche sabor vainilla. 25g de proteína por porción.',
    120000.00, 30, 'Nutrición'
),
(
    '00000000-0000-0000-0000-000000000052',
    '00000000-0000-0000-0000-000000000010',
    'Colchoneta Yoga Antideslizante',
    'Colchoneta 6mm de grosor, material ecológico, incluye bolsa de transporte.',
    95000.00, 20, 'Equipamiento'
);

-- ============================================================
-- SAMPLE: User Membership
-- ============================================================

INSERT INTO user_memberships (id, user_id, plan_id, status, started_at, expires_at, classes_used) VALUES
(
    '00000000-0000-0000-0000-000000000060',
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000041',
    'ACTIVE',
    NOW(),
    NOW() + INTERVAL '30 days',
    0
);

-- ============================================================
-- SAMPLE: Reservation
-- ============================================================

INSERT INTO reservations (class_id, user_id, status) VALUES
(
    '00000000-0000-0000-0000-000000000030',
    '00000000-0000-0000-0000-000000000004',
    'CONFIRMED'
);

-- ============================================================
-- SAMPLE: Order + Items
-- ============================================================

INSERT INTO orders (id, user_id, gym_id, status, total_amount, shipping_address) VALUES
(
    '00000000-0000-0000-0000-000000000070',
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000010',
    'PAID',
    205000.00,
    'Calle 45 #12-30, Bogotá'
);

INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
(
    '00000000-0000-0000-0000-000000000070',
    '00000000-0000-0000-0000-000000000050',
    1, 85000.00
),
(
    '00000000-0000-0000-0000-000000000070',
    '00000000-0000-0000-0000-000000000052',
    1, 95000.00
);

-- ============================================================
-- END OF SEED
-- ============================================================
