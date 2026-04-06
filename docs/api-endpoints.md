# API Endpoints Reference

Base URL: `http://localhost:3000/api`

All protected routes require: `Authorization: Bearer <JWT>`

---

## Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register new user |
| POST | `/auth/login` | Public | Login, returns JWT |
| POST | `/auth/refresh` | Public | Refresh access token |
| GET | `/auth/me` | 🔒 Any | Get current user profile |

---

## Users

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/users` | 🔒 ADMIN | List all users |
| GET | `/users/:id` | 🔒 ADMIN | Get user by ID |
| PATCH | `/users/:id` | 🔒 ADMIN | Update user |
| DELETE | `/users/:id` | 🔒 ADMIN | Delete user |

---

## Gyms

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/gyms` | Public | List all active gyms |
| GET | `/gyms/:id` | Public | Get gym details |
| POST | `/gyms` | 🔒 GYM_OWNER | Create gym |
| PATCH | `/gyms/:id` | 🔒 GYM_OWNER | Update gym |
| DELETE | `/gyms/:id` | 🔒 ADMIN | Delete gym |

---

## Trainers

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/trainers` | Public | List all trainers |
| GET | `/trainers/:id` | Public | Trainer profile |
| POST | `/gyms/:gymId/trainers` | 🔒 GYM_OWNER | Assign trainer to gym |
| DELETE | `/gyms/:gymId/trainers/:id` | 🔒 GYM_OWNER | Remove trainer from gym |

---

## Classes

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/gyms/:gymId/classes` | Public | List classes of a gym |
| GET | `/classes/:id` | Public | Class details |
| POST | `/gyms/:gymId/classes` | 🔒 GYM_OWNER, TRAINER | Create class |
| PATCH | `/classes/:id` | 🔒 GYM_OWNER, TRAINER | Update class |
| DELETE | `/classes/:id` | 🔒 GYM_OWNER | Delete class |

---

## Reservations

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/reservations/my` | 🔒 USER | My reservations |
| POST | `/reservations` | 🔒 USER | Book a class |
| DELETE | `/reservations/:id` | 🔒 USER | Cancel reservation |
| GET | `/gyms/:gymId/reservations` | 🔒 GYM_OWNER | All gym reservations |

---

## Memberships

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/gyms/:gymId/plans` | Public | Membership plans |
| POST | `/gyms/:gymId/plans` | 🔒 GYM_OWNER | Create plan |
| PATCH | `/plans/:id` | 🔒 GYM_OWNER | Update plan |
| POST | `/memberships/subscribe` | 🔒 USER | Subscribe to plan |
| GET | `/memberships/my` | 🔒 USER | My active memberships |

---

## Marketplace

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/products` | Public | List all products |
| GET | `/products/:id` | Public | Product details |
| POST | `/gyms/:gymId/products` | 🔒 GYM_OWNER | Create product |
| PATCH | `/products/:id` | 🔒 GYM_OWNER | Update product |
| DELETE | `/products/:id` | 🔒 GYM_OWNER | Delete product |

---

## Orders

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/orders` | 🔒 USER | Create order |
| GET | `/orders/my` | 🔒 USER | My orders |
| GET | `/orders/:id` | 🔒 USER, GYM_OWNER | Order details |
| GET | `/gyms/:gymId/orders` | 🔒 GYM_OWNER | All gym orders |
