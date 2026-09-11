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

FitVibe uses Docker Compose to run Kafka, MinIO S3 storage, MongoDB, and Memcached locally.

```bash
docker compose up -d
```

This starts:
- **Kafka Broker**: `localhost:9092`
- **MinIO S3 Storage**: `localhost:9000` (API) & `localhost:9001` (Web Console)
- **MongoDB**: `localhost:27017`
- **Memcached**: `localhost:11211`

---

## ⚙️ Environment Configuration

Create a `.env` file in `FiteVibe-Backend` (or use `.env.example` as a template):

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/fitvibe
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

---

## 📡 API Endpoints Summary

### Auth
- `POST /api/auth/signup`: Client account registration.
- `POST /api/auth/signin`: Local authentication sign in.
- `GET /api/auth/current_user`: Fetch current authenticated user.
- `POST /api/auth/logout`: End session.
- `POST /api/auth/fcm_token`: Register FCM device token for push notifications.

### Home & Daily Measures
- `GET /api/home`: Retrieves complete home payload: `dailyLogin` streak, `water` intake, `trainingDay` planner, `dailyMeals` plan, `dailyMeasures` metrics (weight, net calories, macro targets), and **`challenges`** list (with `isLocked` and `isEnrolled` flags).
- `POST /api/home/meals/log`: Updates meal log status (`completed`, `pending`, `upcoming`) and invalidates `daily_measures` cache.
- `POST /api/home/water/add`: Logs water intake cups.

### Coach Challenges & Community
- `GET /api/challenges/:id`: Fetch challenge details and daily task timeline.
- `POST /api/challenges/:id/join`: Enroll user in challenge (checks Free vs Premium entitlement).
- `GET /api/challenges/:id/leaderboard`: Single-challenge leaderboard ranking ("Classement").
- `GET /api/challenges/:id/posts`: Fetch community feed posts for a challenge (Memcached cached).
- `POST /api/challenges/:id/posts`: Create a community post with text and optional media.
- `GET /api/challenges/posts/:postId/comments`: Fetch comments for a post.
- `POST /api/challenges/posts/:postId/comments`: Add a comment to a post.
- `POST /api/challenges/posts/:postId/react`: Toggle post reaction (`like`, `fire`, `clap`, `muscle`), streaming event to Kafka for background FCM notifications & cache flushing.

### Settings
- `GET /api/settings/water`: Fetch user water reminder settings.
- `POST /api/settings/water`: Update water intake daily target and reminder interval.

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
