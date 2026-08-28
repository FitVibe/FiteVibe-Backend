# FitVibe Backend API

FitVibe is a fitness and gym management backend API built with Node.js, Express, TypeScript, MongoDB, Kafka, MinIO (S3), and Firebase Cloud Messaging.

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
    - [Get Home Data (Streak, Water, Training Day)](#6-home-data-daily-login-streak-water--training-day)
    - [Add Water Cup](#7-add-water-cup)
  - [Settings](#settings)
    - [Get Water Settings](#8-get-water-settings)
    - [Update Water Settings](#9-update-water-settings)
- [MinIO S3 Storage](#-minio-s3-storage)
- [Daily Workout Push Notifications](#-daily-workout-push-notifications)
- [Project Structure](#-project-structure)

---

## 🛠 Prerequisites

Make sure you have the following installed on your system:

- **Node.js**: `v18.x` or higher ([Download Node.js](https://nodejs.org/))
- **npm**: `v9.x` or higher (comes with Node.js)
- **Docker & Docker Compose**: ([Download Docker](https://www.docker.com/))

---

## 🐳 Infrastructure Setup (Docker Compose)

FitVibe uses Docker Compose to run Kafka, MinIO S3 storage, and MongoDB locally.

### Start Containers

Run the following command in the `FiteVibe-Backend` directory:

```bash
docker compose up -d
```

This starts:
- **Kafka Broker**: `localhost:9092`
- **MinIO S3 Storage**: `localhost:9000` (API) & `localhost:9001` (Web Console)
- **MongoDB**: `localhost:27017`

### MinIO Web Console Login
- **URL**: `http://localhost:9001`
- **Username**: `minioadmin`
- **Password**: `minioadmin`

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

Populate MinIO bucket with exercise media, seed workouts, daily training planners, and a test client user in MongoDB:

```bash
npm run seed
```

This script:
1. Initializes MinIO bucket `fitvibe-media` with public read access.
2. Uploads sample exercise videos (`pushups_demo.mp4`, `squats_demo.mp4`, etc.).
3. Seeds mock `Workout` records (Chest, Legs, Core, Cardio).
4. Seeds `DailyTrainingPlanner` records for today and future days (`isFree: true`).
5. Creates a default test client account:
   - **Username**: `testuser`
   - **Password**: `password123`

---

## 🏃 Running the Application

### Development Mode (Hot-Reloading)

```bash
npm run dev
```

The server will start at `http://localhost:3000`.

### Production Build

```bash
npm run build
npm start
```

---

## 📡 API Endpoints

### 1. Sign Up
- **Method**: `POST`
- **URL**: `/api/auth/sign_up`
- **Headers**: `Content-Type: application/json`
- **Body**:

```json
{
  "username": "john_doe",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "password": "mySecurePassword123",
  "account_type": "client",
  "client": {
    "weight": 75,
    "height": 180,
    "fats": "15",
    "personal_goals": {
      "goal": "Increase physical fitness",
      "weight_goal": 70
    }
  },
  "age": 25,
  "gender": "male"
}
```

---

### 2. Sign In
- **Method**: `POST`
- **URL**: `/api/auth/sign_in`
- **Body**:

```json
{
  "username": "john_doe",
  "password": "mySecurePassword123"
}
```

---

### 3. Current User
- **Method**: `GET`
- **URL**: `/api/auth/current_user`

---

### 4. Logout
- **Method**: `POST`
- **URL**: `/api/auth/logout`

---

### 5. Update FCM Token
Registers/updates the device FCM push token for water and daily workout reminders.

- **Method**: `PATCH`
- **URL**: `/api/auth/fcm-token`
- **Body**:

```json
{
  "fcm_token": "device_fcm_token_from_firebase_sdk"
}
```

---

### 6. Home Data (Daily Login Streak, Water & Training Day)
Retrieves home screen data for the authenticated client, including login streak, daily water intake log, and today's training day planner.

- **Method**: `GET`
- **URL**: `/api/home`
- **Response Example (200 OK)**:

```json
{
  "dailyLogin": {
    "streakCount": 5,
    "lastLoginDate": "2026-08-28T00:00:00.000Z"
  },
  "water": {
    "today_intake_ml": 500,
    "daily_need_ml": 2500,
    "cup_size_ml": 250,
    "progress_percentage": 20
  },
  "trainingDay": {
    "plannerId": "66ce7a1f123456789abcdef0",
    "name": "Full Body Free Starter Workout",
    "isFree": true,
    "exercisesCount": 4,
    "totalTime": 40,
    "isCompleted": false,
    "date": "2026-08-28T00:00:00.000Z",
    "exercises": [
      {
        "workoutId": "66ce7a1e123456789abcdef1",
        "name": "Standard Push-Ups",
        "category": "Chest & Arms",
        "difficulty": "Beginner",
        "video": "http://localhost:9000/fitvibe-media/pushups_demo.mp4",
        "description": "Classic push-up targeting chest, shoulders, and triceps.",
        "place": "Home",
        "duration": 60,
        "repeatition": 15,
        "sets": 3,
        "kilos": 0
      }
    ]
  }
}
```

---

### 7. Add Water Cup
- **Method**: `POST`
- **URL**: `/api/home/water/add`

---

### 8. Get Water Settings
- **Method**: `GET`
- **URL**: `/api/settings/water`

---

### 9. Update Water Settings
- **Method**: `PUT`
- **URL**: `/api/settings/water`

---

## 🪣 MinIO S3 Storage

Workout videos and media assets are stored in MinIO object storage bucket `fitvibe-media`.
- **Initialization**: Automatically executed on server startup via `initMinioBucket()`.
- **Public Read Access**: Public read bucket policy applied automatically so video URLs (e.g. `http://localhost:9000/fitvibe-media/pushups_demo.mp4`) can be played directly on client applications.

---

## 🔔 Daily Workout Push Notifications

FitVibe uses KafkaJS + Firebase Admin SDK for event-driven daily notifications:
- **Kafka Topic**: `workout-reminders`
- **Producer**: [workoutReminderProducer.ts](file:///home/salah/Projects/github/FitVibe/FiteVibe-Backend/infrastructure/kafka/workoutReminderProducer.ts) triggers daily ticks.
- **Consumer**: [workoutReminderConsumer.ts](file:///home/salah/Projects/github/FitVibe/FiteVibe-Backend/infrastructure/kafka/workoutReminderConsumer.ts) inspects users, finds today's daily workout planner, and sends FCM push notification:
  - **Title**: `🏋️ workout of today!`
  - **Body**: `Hello {first_name}! Today's workout "{planner.name}" ({duration} mins, {count} exercises) is ready. Let's crush it!`

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
│   ├── entities/         # TypeScript interfaces (User, Workout, DailyTrainingPlanner, DailyLogin, etc.)
│   ├── types/            # Type declarations
│   └── validator/        # Validation contracts
├── infrastructure/
│   ├── database/
│   │   ├── models/       # Mongoose models (userModel, workoutModel, dailyTrainingPlannerModel, etc.)
│   │   └── MongoDatabase.ts
│   ├── firebase/         # Firebase Admin SDK & FCM push helpers
│   ├── kafka/            # KafkaJS client, water & workout producers/consumers
│   ├── minio/            # MinIO S3 storage client & helpers
│   ├── passport_js/      # Passport authentication strategy
│   └── validators/       # Request validation logic
├── scripts/
│   └── seedMockData.ts   # Seed script for MinIO media, workouts, planners, and test user
├── docker-compose.yml    # Kafka + MinIO + MongoDB container configuration
├── .env                  # Environment configuration
├── package.json
└── tsconfig.json
```
