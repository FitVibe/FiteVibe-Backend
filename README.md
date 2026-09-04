# FitVibe Backend API

FitVibe is a fitness, gym, and nutrition management backend API built with Node.js, Express, TypeScript, MongoDB, Kafka, MinIO (S3), and Firebase Cloud Messaging.

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
    - [Get Home Data (Streak, Water, Training Day, Daily Meals)](#6-home-data-daily-login-streak-water-training-day--daily-meals)
    - [Log Meal Status](#7-log-meal-status)
    - [Add Water Cup](#8-add-water-cup)
  - [Settings](#settings)
    - [Get Water Settings](#9-get-water-settings)
    - [Update Water Settings](#10-update-water-settings)
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

Populate MinIO bucket with exercise media, seed workouts, daily training planners, mock meals, daily meals plan, and a test client user in MongoDB:

```bash
npm run seed
```

This script:
1. Initializes MinIO bucket `fitvibe-media` with public read access.
2. Uploads sample exercise videos (`pushups_demo.mp4`, `squats_demo.mp4`, etc.).
3. Seeds mock `Workout` records (Chest, Legs, Core, Cardio).
4. Seeds `DailyTrainingPlanner` records for today and future days (`isFree: true`).
5. Seeds mock `Meal` records (`Oatmeal & Protein Shake`, `Grilled Chicken & Quinoa`, `Salmon & Asparagus`, `Greek Yogurt & Berries`) with split macros (`carbs`, `protein`, `fats`, `calories`) and ingredients list.
6. Seeds `DailyMeals` plan for today with UI status tags (`completed` / `تم التسجيل`, `pending` / `سجّل الوجبة`, `upcoming` / `قادم`).
7. Creates a default test client account:
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
- **Method**: `PATCH`
- **URL**: `/api/auth/fcm-token`
- **Body**:

```json
{
  "fcm_token": "device_fcm_token_from_firebase_sdk"
}
```

---

### 6. Home Data (Daily Login Streak, Water, Training Day & Daily Meals)
Retrieves complete home screen data for the client, including login streak, daily water intake log, today's training day planner, and today's nutrition plan.

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
  "trainingDay": {
    "plannerId": "66ce7a1f123456789abcdef0",
    "name": "Full Body Free Starter Workout",
    "isFree": true,
    "exercisesCount": 4,
    "totalTime": 40,
    "isCompleted": false,
    "date": "2026-09-04T00:00:00.000Z",
    "exercises": [ ... ]
  },
  "dailyMeals": {
    "planId": "66ce7a20123456789abcdef2",
    "date": "2026-09-04T00:00:00.000Z",
    "is_complete": false,
    "isFree": true,
    "totalCalories": 1850,
    "totalCarbs": 165,
    "totalProtein": 150,
    "totalFats": 57,
    "meals": [
      {
        "meal_type": "Breakfast",
        "status": "completed",
        "logged_at": "2026-09-04T08:30:00.000Z",
        "meal": {
          "_id": "66ce7a1e123456789abcdef3",
          "name": "شوفان وبروتين شيك (Oatmeal & Protein Shake)",
          "calories": 450,
          "carbs": 55,
          "protein": 35,
          "fats": 10,
          "ingredients": [
            "Rolled Oats 80g",
            "Whey Protein 30g",
            "Almond Milk 250ml",
            "Banana 1"
          ],
          "image": "",
          "isFree": true
        }
      },
      {
        "meal_type": "Lunch",
        "status": "pending",
        "logged_at": null,
        "meal": {
          "_id": "66ce7a1e123456789abcdef4",
          "name": "دجاج مشوي وكينوا (Grilled Chicken & Quinoa)",
          "calories": 650,
          "carbs": 65,
          "protein": 55,
          "fats": 18,
          "ingredients": [
            "Chicken Breast 200g",
            "Quinoa 150g",
            "Steamed Vegetables",
            "Olive Oil 10ml"
          ],
          "image": "",
          "isFree": true
        }
      },
      {
        "meal_type": "Dinner",
        "status": "upcoming",
        "logged_at": null,
        "meal": {
          "_id": "66ce7a1e123456789abcdef5",
          "name": "سلمون وأسباراغوس (Salmon & Asparagus)",
          "calories": 550,
          "carbs": 25,
          "protein": 45,
          "fats": 25,
          "ingredients": [
            "Fresh Salmon Fillet 200g",
            "Grilled Asparagus 150g",
            "Lemon Juice",
            "Garlic Butter"
          ],
          "image": "",
          "isFree": true
        }
      }
    ]
  }
}
```

---

### 7. Log Meal Status
Updates the status of a specific meal (`completed`, `pending`, `upcoming`) in the user's daily meals plan.

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

- **Response Example (200 OK)**:

```json
{
  "status": "success",
  "data": {
    "_id": "66ce7a20123456789abcdef2",
    "is_complete": false,
    "meals": [ ... ]
  }
}
```

---

### 8. Add Water Cup
- **Method**: `POST`
- **URL**: `/api/home/water/add`

---

### 9. Get Water Settings
- **Method**: `GET`
- **URL**: `/api/settings/water`

---

### 10. Update Water Settings
- **Method**: `PUT`
- **URL**: `/api/settings/water`

---

## 🪣 MinIO S3 Storage

Workout videos and media assets are stored in MinIO object storage bucket `fitvibe-media`.
- **Initialization**: Automatically executed on server startup via `initMinioBucket()`.
- **Public Read Access**: Public read bucket policy applied automatically so video URLs can be played directly on client applications.

---

## 🔔 Scheduled Push Notifications (Workouts & Meals)

FitVibe uses KafkaJS + Firebase Admin SDK for event-driven notifications:

1. **Daily Workout Reminder**:
   - **Topic**: `workout-reminders`
   - Dispatches daily workout push notifications (`"🏋️ workout of today!"`).

2. **Daily Meal Reminders (UTC)**:
   - **Topic**: `meal-reminders`
   - **Breakfast**: 07:00 UTC (08:00 UTC+1) -> `"🥣 Breakfast Time!"`
   - **Lunch**: 11:00 UTC (12:00 UTC+1) -> `"🍛 Lunch Time!"`
   - **Snacks**: 15:00 UTC (16:00 UTC+1) -> `"🥗 Snack Time!"`
   - **Dinner**: 19:00 UTC (20:00 UTC+1) -> `"🍽️ Dinner Time!"`

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
│   └── types/            # Type declarations
├── infrastructure/
│   ├── database/
│   │   ├── models/       # Mongoose models (userModel, workoutModel, mealModel, dailyMealsModel, etc.)
│   │   └── MongoDatabase.ts
│   ├── firebase/         # Firebase Admin SDK & FCM push helpers
│   ├── kafka/            # KafkaJS client, water, workout & meal producers/consumers
│   ├── minio/            # MinIO S3 storage client & helpers
│   └── passport_js/      # Passport authentication strategy
├── scripts/
│   └── seedMockData.ts   # Seed script for MinIO media, workouts, planners, meals, and test user
├── docker-compose.yml    # Kafka + MinIO + MongoDB container configuration
├── .env                  # Environment configuration
├── package.json
└── tsconfig.json
```
