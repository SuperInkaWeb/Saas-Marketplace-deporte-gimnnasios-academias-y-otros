# Roles & Permissions

## Role Definitions

### 1. ADMIN (Platform Administrator)
- Full access to the entire platform
- Manages all users, gyms, trainers
- Views global analytics and reports
- Can suspend or activate any account
- Creates platform-wide configurations

### 2. GYM_OWNER (Sports Business)
- Represents a gym, academy, or sports club
- Registers and configures their business profile
- Creates/edits classes and schedules
- Manages their trainers (assign/remove)
- Defines membership plans and pricing
- Lists products on the marketplace
- Views their own gym analytics
- Cannot access other gyms' data

### 3. TRAINER
- Account linked to one or more gyms (assigned by Gym Owner)
- Views their assigned classes and schedule
- Can create classes if granted permission by Gym Owner
- Manages their own trainer profile (bio, certifications, specialties)
- Cannot access financial data

### 4. USER (End User / Customer)
- Browses gyms, classes, trainers, and products
- Books/reserves classes
- Subscribes to membership plans
- Makes purchases on the marketplace
- Views their own booking & order history
- Manages their profile

---

## Permissions Matrix

| Permission | ADMIN | GYM_OWNER | TRAINER | USER |
|---|:---:|:---:|:---:|:---:|
| **Platform Management** | | | | |
| View all users | ✅ | ❌ | ❌ | ❌ |
| Suspend/activate any account | ✅ | ❌ | ❌ | ❌ |
| View all gyms | ✅ | ❌ | ❌ | ❌ |
| View platform analytics | ✅ | ❌ | ❌ | ❌ |
| **Gym Management** | | | | |
| Create gym | ✅ | ✅ | ❌ | ❌ |
| Edit own gym | ✅ | ✅ | ❌ | ❌ |
| Delete gym | ✅ | ❌ | ❌ | ❌ |
| View gym analytics | ✅ | ✅ | ❌ | ❌ |
| **Trainer Management** | | | | |
| Assign trainer to gym | ✅ | ✅ | ❌ | ❌ |
| Edit own trainer profile | ✅ | ✅ | ✅ | ❌ |
| **Classes** | | | | |
| Create/edit classes | ✅ | ✅ | ✅* | ❌ |
| Delete classes | ✅ | ✅ | ❌ | ❌ |
| View class schedule | ✅ | ✅ | ✅ | ✅ |
| **Reservations** | | | | |
| Book a class | ❌ | ❌ | ❌ | ✅ |
| Cancel own reservation | ❌ | ❌ | ❌ | ✅ |
| View all reservations (gym) | ✅ | ✅ | ❌ | ❌ |
| **Memberships** | | | | |
| Create membership plans | ✅ | ✅ | ❌ | ❌ |
| Subscribe to membership | ❌ | ❌ | ❌ | ✅ |
| View own membership | ❌ | ❌ | ❌ | ✅ |
| **Marketplace** | | | | |
| Create/edit products | ✅ | ✅ | ❌ | ❌ |
| Delete products | ✅ | ✅ | ❌ | ❌ |
| Purchase products | ❌ | ❌ | ❌ | ✅ |
| View order history (own) | ❌ | ❌ | ❌ | ✅ |
| View all orders (gym) | ✅ | ✅ | ❌ | ❌ |

*Trainers can create classes only if the Gym Owner has granted them the `can_create_classes` permission in `gym_trainers`.

---

## JWT Payload Structure

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "GYM_OWNER",
  "gymId": "gym-uuid",
  "iat": 1700000000,
  "exp": 1700086400
}
```
