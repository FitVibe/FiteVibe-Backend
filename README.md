# FitVibe Backend API

FitVibe is a high-performance fitness, gym, nutrition, and community backend API built with **Node.js**, **Express**, **TypeScript**, **MongoDB**, **Kafka**, **MinIO (S3)**, **Memcached**, and **Firebase Cloud Messaging (FCM)** following strict **Clean Architecture** principles.

---

## 📋 Table of Contents

- [Prerequisites](#-prerequisites)
- [Infrastructure Setup (Docker Compose)](#-infrastructure-setup-docker-compose)
- [Environment Configuration](#-environment-configuration)
- [Installation & Scripts](#-installation--scripts)
- [Mock Data Seeding](#-mock-data-seeding)
- [Running the Application](#-running-the-application)
- [Architecture & Design Systems](#-architecture--design-systems)
  - [Clean Architecture Boundaries](#clean-architecture-boundaries)
  - [Coach Challenges & Community System](#coach-challenges--community-system)
  - [Kafka Asynchronous Pipelines](#kafka-asynchronous-pipelines)
  - [Memcached Strategy & TTL Table](#memcached-strategy--ttl-table)
- [API Endpoints](#-api-endpoints)
  - [Auth Endpoints](#auth)
  - [Home & Daily Measures Endpoints](#home)
  - [Coach Challenges & Community Endpoints](#coach-challenges--community)
  - [Settings Endpoints](#settings)
- [Project Structure](#-project-structure)

---

## 🛠 Prerequisites

Make sure you have the following installed on your system:

- **Node.js**: `v18.x` or higher ([Download Node.js](https://nodejs.org/))
- **npm**: `v9.x` or higher (comes with Node.js)
- **Docker & Docker Compose**: ([Download Docker](https://www.docker.com/))

---

## 🐳 Infrastructure Setup (Docker Compose)

FitVibe uses Docker Compose to run the full stack: Nginx API Gateway & Web Server, Node Backend API, Kafka, MinIO S3 storage, MongoDB, and Memcached.

```bash
docker compose up -d
```

This starts:
- **Nginx Web & API Gateway**: `localhost:80` (Routes `/` to Frontend, `/api/` to Backend, `/media/` to MinIO)
- **Backend API**: `localhost:3000` (Direct) / `localhost:80/api/` (via Nginx)
- **Kafka Broker**: `localhost:9092`
- **MinIO S3 Storage**: `localhost:9000` (API) & `localhost:9001` (Web Console)
- **MongoDB**: `localhost:27018`
- **Memcached**: `localhost:11211`

---

## ⚙️ Environment Configuration

Create a `.env` file in `FiteVibe-Backend` (or use `.env.example` as a template):

```env
PORT=3000
MONGO_URI=mongodb://localhost:27018/fitvibe
SESSION_SECRET=fitvibe_secret_key

# MinIO (S3 Object Storage)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=fitvibe-media

# Memcached
MEMCACHED_HOST=localhost
MEMCACHED_PORT=11211

# Firebase (Push Notifications)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Kafka
KAFKA_BROKER=localhost:9092
KAFKA_CLIENT_ID=fitvibe-backend
```

---

## 🚀 Installation & Scripts

1. Install dependencies:
   ```bash
   npm install
   ```

2. Available Commands:
   - `npm run dev`: Starts hot-reloading development server via `nodemon` and `ts-node`.
   - `npm run build`: Compiles TypeScript to `dist/` (`tsc`).
   - `npm run start`: Runs production build from `dist/app/index.js`.
   - `npm run seed`: Seeds MinIO S3 media, workouts, meals, planners, mock challenges, and test users.
   - `npm run cache:flush`: Flushes all Memcached cache entries.

---

## 🌱 Mock Data Seeding

Populate MinIO bucket with exercise media, seed workouts, daily training planners, mock meals, daily meals plan, mock community challenges, and a test user:

```bash
npm run seed
```

---

## 🏗 Architecture & Design Systems

### Clean Architecture Boundaries
FitVibe isolates domain entities, repository contracts, and domain business services from outer frameworks (Express, Mongoose, Kafka, Memcached). All high-level services and event consumers consume **Repository interfaces** rather than direct database models.

```
FiteVibe-Backend/
├── domain/            # Pure Entities, Repository Contracts, Calculation Services
├── infrastructure/    # Concrete DB Repositories, Kafka, Memcached, Firebase, MinIO
└── app/               # Express Controllers, Services & DI Container
```

### Coach Challenges & Community System
- **Access Types**: `free` vs `premium` (validated against user subscription tier).
- **Multi-Category Tasks**: Tasks belong to categories (`workout`, `nutrition`, `hydration`, `mindset`).
- **Points Types**:
  - **Type 1 (System Tasks)**: Points awarded on system daily task check-ins.
  - **Type 2 (Coach Custom Content)**: Points awarded strictly on challenge-specific daily task completion.
- **Per-Challenge Leaderboard ("Classement")**: Ranks participants within a challenge based on total earned points.

### Kafka Asynchronous Pipelines
Centralized event streams (`infrastructure/kafka/index.ts`):
- `water-reminders`: Daily water hydration intake push notification ticks.
- `workout-reminders`: Daily workout training plan push notifications.
- `meal-reminders`: Scheduled meal log reminders.
- `challenge-reactions`: High-scale reaction events streamed to background consumer for FCM author push notifications (`"سارة تفاعلت مع منشورك بـ 🔥"`) and Memcached feed cache invalidation.

### Memcached Strategy & TTL Table

| Feature / Key Format | TTL Duration | Invalidation Trigger & Rationale |
| :--- | :--- | :--- |
| `daily_measures:{userId}:{date}` | **86,400s (24h)** | Invalidated immediately on meal status update (`logMealStatus`) or at `00:00 UTC` cron. Eliminates costly BMR/MET recalculations. |
| `challenge:leaderboard:{challengeId}` | **60s (1min)** | Invalidated on task check-in (`checkInTask`). Provides near live rankings while protecting DB under high traffic. |
| `challenge:posts:{challengeId}:{skip}:{limit}` | **120s (2min)** | Invalidated on new post/comment/reaction or via Kafka reaction consumer. Ensures fast feed scrolling. |
| `challenges:published:all` | **300s (5min)** | Invalidated on challenge publication. Caches active challenges list. |

### 📝 Exercise Description Markdown Formatting
Exercise descriptions in `Workout.description` support structured Markdown headings (`##`) parsed by frontends:
```markdown
## طريقة الأداء الصحيحة
1. استلقِ على الأرض مع وضع اليدين بعرض الكتفين
2. ادفع جسمك للأعلى حتى تستقيم الذراعان

## نصيحة التنفس
شهيق عند النزول — زفير عند الدفع للأعلى

## الأخطاء الشائعة
- ترك الوسط يتدلى للأسفل
- فتح المرفقين بزاوية 90 درجة
```

---

## 📡 API Endpoints Summary

### Auth
- `POST /api/auth/signup`: Client account registration.
- `POST /api/auth/signin`: Local authentication sign in.
- `POST /api/auth/logout` (or `/sign_out`): End session.
- `POST /api/auth/reset-password`: Change password verifying `current_password` and updating to `new_password`.
- `GET /api/auth/current_user`: Fetch current authenticated user.
- `PATCH /api/auth/fcm-token`: Register FCM device token for push notifications.

### Home & Daily Measures
- `GET /api/home`: Retrieves complete home payload: `dailyLogin` streak, `water` intake, `trainingDay` planner (populated exercises), `dailyMeals` plan, `dailyMeasures` metrics (weight, net calories, macro targets), and **`challenges`** list (with `isLocked` and `isEnrolled` flags).
- `GET /api/home/planners`: Fetches paginated list of daily training planners (`skip` and `limit` query parameters supported; returns planners sorted by date).
- `GET /api/home/planner/:plannerId`: Fetches full details for a specific daily training planner by `plannerId` (including populated exercise names, categories, video URLs, and Markdown descriptions).
- `GET /api/home/meal/:mealId`: Fetches full details for a specific meal by `mealId` (including calories, protein, carbs, fats, ingredients list, image, and `otherMeals` list for the bottom section in UI).
- `GET /api/home/meals/daily`: Fetches user's daily meals schedule (Breakfast, Lunch, Dinner, Snacks) with statuses, logged time, and macro totals.
- `POST /api/home/workout/complete`: Marks a daily training planner as completed (`isCompleted: true`). Clones shared/free template planners (`userId: null`) into user-specific records for the current user, and invalidates `daily_measures` cache.
- `POST /api/home/meals/log`: Updates meal log status (`completed`, `pending`, `upcoming`) and invalidates `daily_measures` cache.
- `POST /api/home/water/add`: Logs water intake cups.

### Coach Challenges & Community
- `GET /api/challenges`: Fetch paginated list of published challenges (`skip`, `limit` query parameters supported).
- `GET /api/challenges/:id`: Fetch challenge details and daily task timeline.
- `POST /api/challenges/:id/join`: Enroll user in challenge (checks Free vs Premium entitlement).
- `GET /api/challenges/:id/leaderboard`: Single-challenge leaderboard ranking ("Classement").
- `GET /api/challenges/:id/posts`: Fetch community feed posts for a challenge (Memcached cached).
- `POST /api/challenges/:id/posts`: Create a community post with text and optional media.
- `GET /api/challenges/posts/:postId/comments`: Fetch comments for a post.
- `POST /api/challenges/posts/:postId/comments`: Add a comment to a post.
- `POST /api/challenges/posts/:postId/react`: Toggle post reaction (`like`, `fire`, `clap`, `muscle`), streaming event to Kafka for background FCM notifications & cache flushing.

### Notifications
- `GET /api/notifications`: Fetch paginated list of social notifications for current user (`skip`, `limit` supported; returns `notifications`, `total`, `unreadCount`).
- `PATCH /api/notifications/:id/read`: Mark a specific notification as read.
- `PATCH /api/notifications/read-all`: Mark all notifications for current user as read.

### Profile
- `GET /api/profile`: Fetch current user profile including body measurements and fitness goals.
- `PATCH /api/profile`: Update personal info (`first_name`, `last_name`, `city`, `age`, etc.) and body goals (`weight`, `height`, `fats`, `personal_goals`).
- `DELETE /api/profile`: Cascade delete user account, user settings, and session.

### Settings
- `GET /api/settings`: Fetch all settings (water hydration, push notification toggles, preferences, and account tier) in a single aggregated payload.
- `GET /api/settings/water`: Fetch user water reminder settings.
- `PUT /api/settings/water`: Update water intake target (`daily_need`), cup size, and reminder interval.
- `PUT /api/settings/notifications`: Update push notification toggles (`workout_reminders`, `meal_reminders`, `community_updates`).
- `PUT /api/settings/preferences`: Update app preferences (`language: 'en' | 'ar'`).

---

## 📁 Project Structure

```text
FiteVibe-Backend/
├── app/
│   ├── controllers/      # Auth, Home, Water, Challenge controllers
│   ├── middlewares/      # Express middlewares (isAuthenticated)
│   ├── routes/           # Auth, Home, Settings, Challenge routers
│   ├── services/         # UserService, HomeService, WaterService, ChallengeService, ChallengeCommunityService
│   ├── index.ts          # Server entry point
│   ├── services.ts       # Dependency injection container (Repositories & Services)
│   └── controllers.ts    # Controller instances container
├── domain/
│   ├── entities/         # TypeScript interfaces (User, Workout, DailyTrainingPlanner, Challenge, UserChallenge, etc.)
│   ├── repositories/     # Repository interface contracts (IUserRepository, IChallengeRepository, etc.)
│   └── services/         # Pure Calculation Services (MeasureCalculationService, ChallengePointService)
├── infrastructure/
│   ├── cron/             # Centralized cron jobs (startCronJobs)
│   ├── database/
│   │   ├── models/       # Mongoose models (userModel, challengeModel, userChallengeModel, etc.)
│   │   └── repositories/ # Concrete Mongoose repositories (MongoUserRepository, MongoChallengeRepository, etc.)
│   ├── firebase/         # Firebase Admin SDK & FCM push notification helpers
│   ├── kafka/            # Kafka producers & consumers (Water, Workout, Meal, Challenge Reactions)
│   ├── memcached/        # Memcached client & cache invalidation helpers
│   ├── minio/            # MinIO S3 object storage client
│   └── passport_js/      # Passport authentication strategy
├── scripts/
│   ├── seedMockData.ts   # Seed script for MinIO media, workouts, planners, meals, challenges, & test user
│   └── flushCache.ts     # CLI script to flush Memcached cache
├── docker-compose.yml    # Kafka + MinIO + MongoDB + Memcached configuration
├── .env                  # Environment variables
├── package.json
└── tsconfig.json
```
