# FitVibe Backend API

FitVibe is a fitness, gym, and nutrition management backend API built with Node.js, Express, TypeScript, MongoDB, Kafka, MinIO (S3), Memcached, and Firebase Cloud Messaging.

---

## 📋 Table of Contents

- [Prerequisites](#-prerequisites)
- [Infrastructure Setup (Docker Compose)](#-infrastructure-setup-docker-compose)
- [Environment Configuration](#-environment-configuration)
- [Installation](#-installation)
- [Mock Data Seeding](#-mock-data-seeding)
- [Running the Application](#-running-the-application)
- [API Endpoints](#-api-endpoints)
  - [Auth](#auth)
    - [Sign Up](#1-sign-up)
    - [Sign In](#2-sign-in)
    - [Current User](#3-current-user)
    - [Logout](#4-logout)
    - [Update FCM Token](#5-update-fcm-token)
  - [Home](#home)
    - [Get Home Data (Streak, Water, Training Day, Daily Meals, Daily Measures)](#6-home-data-daily-login-streak-water-training-day-daily-meals--daily-measures)
    - [Log Meal Status](#7-log-meal-status)
    - [Add Water Cup](#8-add-water-cup)
  - [Settings](#settings)
    - [Get Water Settings](#9-get-water-settings)
    - [Update Water Settings](#10-update-water-settings)
- [Memcached Caching & Domain Calculation Services](#-memcached-caching--domain-calculation-services)
- [MinIO S3 Storage](#-minio-s3-storage)
- [Scheduled Push Notifications (Workouts & Meals)](#-scheduled-push-notifications-workouts--meals)
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

### Start Containers

Run the following command in the `FiteVibe-Backend` directory:

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

## 🚀 Installation

1. Clone the repository and navigate to the backend directory:
   ```bash
   cd FiteVibe-Backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

---

## 🌱 Mock Data Seeding

Populate MinIO bucket with exercise media, seed workouts, daily training planners, mock meals, daily meals plan, and a test client user in MongoDB, and flush Memcached cache:

```bash
npm run seed
```

---

## 🏃 Running the Application

### Development Mode (Hot-Reloading)

```bash
npm run dev
```

The server will start at `http://localhost:3000`.

---

## 📡 API Endpoints

### 6. Home Data (Daily Login Streak, Water, Training Day, Daily Meals & Daily Measures)
Retrieves complete home screen data for the client, including login streak, daily water intake log, today's training day planner, today's nutrition plan, and cached daily measures metrics ("مقاييس اليوم").

- **Method**: `GET`
- **URL**: `/api/home`
- **Response Example (200 OK)**:

```json
{
  "dailyLogin": {
    "streakCount": 5,
    "lastLoginDate": "2026-09-04T00:00:00.000Z"
  },
  "water": {
    "today_intake_ml": 500,
    "daily_need_ml": 2500,
    "cup_size_ml": 250,
    "progress_percentage": 20
  },
  "trainingDay": { ... },
  "dailyMeals": { ... },
  "dailyMeasures": {
    "weight": {
      "current": 75,
      "goal": 70,
      "unit": "kg"
    },
    "activity": {
      "workoutTimeMinutes": 45,
      "burnedCalories": 350
    },
    "calories": {
      "currentNetCalories": 1100,
      "consumedCalories": 1450,
      "burnedCalories": 350,
      "targetCalories": 2100
    },
    "macros": {
      "protein": {
        "currentGrams": 120,
        "targetGrams": 160,
        "calories": 480
      },
      "carbs": {
        "currentGrams": 180,
        "targetGrams": 220,
        "calories": 720
      },
      "fats": {
        "currentGrams": 28,
        "targetGrams": 64,
        "calories": 252
      }
    }
  }
}
```

---

### 7. Log Meal Status
Updates the status of a specific meal (`completed`, `pending`, `upcoming`) in the user's daily meals plan and automatically invalidates the user's Memcached daily measures entry.

- **Method**: `POST`
- **URL**: `/api/home/meals/log`
- **Headers**: `Content-Type: application/json`, Requires active session
- **Body**:

```json
{
  "planId": "66ce7a20123456789abcdef2",
  "mealType": "Lunch",
  "status": "completed"
}
```

---

## ⚡ Memcached Caching & Domain Calculation Services

- **Domain Calculation Service**: Encapsulated pure calculation methods inside `domain/services/MeasureCalculationService.ts`:
  - `calculateMealMacros()`
  - `calculateMacroCalories()`
  - `calculateWorkoutActivity()`
  - `calculateNetCalories()`
- **Memcached Caching**:
  - Key format: `daily_measures:{userId}:{YYYY-MM-DD}`.
  - Invalidation: Cache evicted immediately upon meal status changes (`POST /api/home/meals/log`) or profile updates.
  - Midnight Cleanup: Automated cron job (`0 0 * * *` UTC) flushes daily measure cache at midnight.

---

## 📁 Project Structure

```text
FiteVibe-Backend/
├── app/
│   ├── controllers/      # Auth, Home, Water controllers
│   ├── middlewares/      # Express middlewares (isAuthenticated)
│   ├── routes/           # Express router definitions
│   ├── services/         # UserService, HomeService, WaterService
│   ├── index.ts          # Server entry point
│   ├── services.ts       # Dependency injection container
│   └── controllers.ts    # Controller instances container
├── domain/
│   ├── entities/         # TypeScript interfaces (User, Workout, DailyTrainingPlanner, Meal, DailyMeals, etc.)
│   ├── repositories/     # Repository interfaces contracts (IUserRepository, IDailyMealsRepository, etc.)
│   └── services/         # Domain Calculation Services (MeasureCalculationService)
├── infrastructure/
│   ├── cron/             # Centralized cron jobs index (startCronJobs)
│   ├── database/
│   │   ├── models/       # Mongoose models (userModel, workoutModel, mealModel, etc.)
│   │   └── repositories/ # Concrete Mongoose repository implementations (MongoUserRepository, etc.)

│   ├── firebase/         # Firebase Admin SDK & FCM push helpers
│   ├── kafka/            # Centralized Kafka producers & consumers index (startKafkaPipelines)
│   ├── memcached/        # Memcached client & midnight cron invalidation
│   ├── minio/            # MinIO S3 storage client & helpers
│   └── passport_js/      # Passport authentication strategy
├── scripts/
│   └── seedMockData.ts   # Seed script for MinIO media, workouts, planners, meals, and test user
├── docker-compose.yml    # Kafka + MinIO + MongoDB + Memcached container configuration
├── .env                  # Environment configuration
├── package.json
└── tsconfig.json
```
