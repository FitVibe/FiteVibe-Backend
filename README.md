# FitVibe Backend API

FitVibe is a fitness and gym management backend API built with Node.js, Express, TypeScript, and MongoDB.

---

## 📋 Table of Contents

- [Prerequisites](#-prerequisites)
- [Database Setup (MongoDB)](#-database-setup-mongodb)
- [Environment Configuration](#-environment-configuration)
- [Installation](#-installation)
- [Running the Application](#-running-the-application)
- [API Endpoints](#-api-endpoints)
  - [Auth](#auth)
    - [Sign Up](#1-sign-up)
    - [Sign In](#2-sign-in)
    - [Current User](#3-current-user)
    - [Logout](#4-logout)
    - [Update FCM Token](#5-update-fcm-token)
  - [Home](#home)
    - [Get Home Data](#6-home-daily-login-streak)
    - [Add Water Cup](#7-add-water-cup)
  - [Settings](#settings)
    - [Get Water Settings](#8-get-water-settings)
    - [Update Water Settings](#9-update-water-settings)
- [Project Structure](#-project-structure)

---

## 🛠 Prerequisites

Make sure you have the following installed on your system:

- **Node.js**: `v18.x` or higher ([Download Node.js](https://nodejs.org/))
- **npm**: `v9.x` or higher (comes with Node.js)
- **MongoDB**: Community Edition or MongoDB Atlas cluster ([Download MongoDB](https://www.mongodb.com/try/download/community))
- **mongosh**: MongoDB Shell (optional, for direct database querying)

---

## 🍃 Database Setup (MongoDB)

### 1. Start Local MongoDB Service

- **Linux / Ubuntu / WSL**:
  ```bash
  sudo service mongodb start
  # or
  sudo systemctl start mongod
  ```

- **Windows**:
  Ensure MongoDB service is running in Windows Services (`services.msc`) or run `mongod.exe`.

### 2. Verify Database Connection (Optional)

You can verify that MongoDB is running using `mongosh`:

```bash
mongosh "mongodb://localhost:27017/fitvibe"
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the root of `FiteVibe-Backend` (or verify existing `.env`):

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/fitvibe
SESSION_SECRET=your_session_secret

# Firebase (for push notifications)
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

2. Install all dependencies:
   ```bash
   npm install
   ```

---

## 🏃 Running the Application

### Development Mode (with Hot-Reloading)

Runs the server using `nodemon` and `ts-node`:

```bash
npm run dev
```

The server will start listening on `http://localhost:3000`.

### Production Build

1. Compile TypeScript to JavaScript:
   ```bash
   npm run build
   ```

2. Start compiled JavaScript production server:
   ```bash
   npm start
   ```

---

## 📡 API Endpoints

### 1. Sign Up
Creates a new user account (supports `client`, `coach`, or `admin` types).

- **Method**: `POST`
- **URL**: `http://localhost:3000/api/auth/sign_up`
- **Headers**: `Content-Type: application/json`
- **Request Body Example**:

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
      "goal": "Weight loss",
      "weight_goal": 70
    }
  },
  "age": 25,
  "gender": "male"
}
```

- **Success Response (200 OK)**:

```json
{
  "status": "success",
  "data": {
    "_id": "66a80b1e123456789abcdef0",
    "username": "john_doe",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "account_type": "client",
    "age": 25,
    "gender": "male",
    "client": {
      "weight": 75,
      "height": 180,
      "fats": "15",
      "personal_goals": {
        "goal": "Weight loss",
        "weight_goal": 70
      }
    }
  }
}
```

---

### 2. Sign In
Authenticates user credentials using Passport Local Strategy.

- **Method**: `POST`
- **URL**: `http://localhost:3000/api/auth/sign_in`
- **Headers**: `Content-Type: application/json`
- **Request Body Example**:

```json
{
  "username": "john_doe",
  "password": "mySecurePassword123"
}
```

- **Success Response (200 OK)**:

```json
{
  "status": "success",
  "data": {
    "_id": "66a80b1e123456789abcdef0",
    "username": "john_doe",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "account_type": "client",
    "age": 25,
    "gender": "male",
    "client": {
      "weight": 75,
      "height": 180,
      "fats": "15",
      "personal_goals": {
        "goal": "Weight loss",
        "weight_goal": 70
      }
    }
  }
}
```

---

### 3. Current User
Retrieves the currently authenticated user's session data.

- **Method**: `GET`
- **URL**: `http://localhost:3000/api/auth/current_user`
- **Success Response (200 OK)**:

```json
{
  "status": "success",
  "data": {
    "_id": "66a80b1e123456789abcdef0",
    "username": "john_doe",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "account_type": "client",
    "age": 25,
    "gender": "male",
    "client": {
      "weight": 75,
      "height": 180,
      "fats": "15",
      "personal_goals": {
        "goal": "Weight loss",
        "weight_goal": 70
      }
    }
  }
}
```

- **Unauthenticated Response (401 Unauthorized)**:

```json
{
  "status": "error",
  "message": "Not authenticated"
}
```

---

### 4. Logout
Logs out the current authenticated user and terminates the session.

- **Method**: `POST`
- **URL**: `http://localhost:3000/api/auth/logout`
- **Success Response (200 OK)**:

```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

---

### 5. Update FCM Token
Registers or refreshes the device's Firebase Cloud Messaging token. The mobile app calls this automatically right after sign in and whenever Firebase rotates the token. Required for push notification delivery (water reminders).

- **Method**: `PATCH`
- **URL**: `http://localhost:3000/api/auth/fcm-token`
- **Headers**: `Content-Type: application/json`, Requires active session
- **Request Body**:

```json
{
  "fcm_token": "device_fcm_token_from_firebase_sdk"
}
```

- **Success Response (200 OK)**:

```json
{
  "status": "success",
  "message": "FCM token updated"
}
```

- **Error Response (400 Bad Request)** — missing or invalid token field:

```json
{
  "status": "error",
  "message": "fcm_token is required"
}
```

> **Mobile usage**: Call this endpoint immediately after a successful sign in, and subscribe to Firebase's `onTokenRefresh` callback to keep it up to date automatically.


---

### 6. Home (Daily Login Streak)
Retrieves the home page data for the authenticated user, which currently includes their daily login streak. The streak counter automatically increments indefinitely upon daily visits, and resets to 1 if a day is skipped.

- **Method**: `GET`
- **URL**: `http://localhost:3000/api/home`
- **Headers**: Requires active session (handled via Auth Middleware)
- **Success Response (200 OK)**:

```json
{
  "dailyLogin": {
    "streakCount": 5,
    "lastLoginDate": "2023-10-25T00:00:00.000Z"
  }
}
```

- **Unauthenticated Response (401 Unauthorized)**:

```json
{
  "status": "error",
  "message": "Not authenticated"
}
```

---

### 7. Add Water Cup
Adds one cup of water (based on the user's configured `cup_size_ml`) to today's water log.

- **Method**: `POST`
- **URL**: `http://localhost:3000/api/home/water/add`
- **Headers**: Requires active session
- **Success Response (200 OK)**:

```json
{
  "status": "success",
  "data": {
    "_id": "...",
    "userId": "...",
    "date": "2026-08-20T00:00:00.000Z",
    "quantity_ml": 500,
  }
}
```

---

## Settings

### 8. Get Water Settings
Returns the current water configuration for the authenticated user.

- **Method**: `GET`
- **URL**: `http://localhost:3000/api/settings/water`
- **Headers**: Requires active session
- **Success Response (200 OK)**:

```json
{
  "status": "success",
  "data": {
    "is_active": true,
    "daily_need": 2.5,
    "cup_size_ml": 250,
    "reminder_interval_minutes": 40,
    "next_reminder_at": "2026-08-20T18:10:00.000Z"
  }
}
```

---

### 9. Update Water Settings
Updates the water configuration. Any combination of fields can be sent. Recalculates `next_reminder_at` automatically when `is_active` or `reminder_interval_minutes` changes.

- **Method**: `PUT`
- **URL**: `http://localhost:3000/api/settings/water`
- **Headers**: `Content-Type: application/json`, Requires active session
- **Request Body Example**:

```json
{
  "is_active": true,
  "daily_need": 2.5,
  "cup_size_ml": 250,
  "reminder_interval_minutes": 40
}
```

- **Success Response (200 OK)**:

```json
{
  "status": "success",
  "data": {
    "is_active": true,
    "daily_need": 2.5,
    "cup_size_ml": 250,
    "reminder_interval_minutes": 40,
    "next_reminder_at": "2026-08-20T18:10:00.000Z"
  }
}
```

---

## 📁 Project Structure

```text
FiteVibe-Backend/
├── app/
│   ├── controllers/      # Route controllers (Auth, Home, Water)
│   ├── middlewares/      # Express middlewares (isAuthenticated)
│   ├── routes/           # Express router definitions
│   ├── services/         # Business logic (UserService, HomeService, WaterService)
│   └── index.ts          # Express app entry point
├── domain/
│   ├── entities/         # TypeScript interfaces & domain entities
│   ├── types/            # Global declaration types (.d.ts)
│   └── validator/        # Validation contracts
├── infrastructure/
│   ├── database/
│   │   └── models/       # Mongoose models (User, DailyLogin, DailyTasks,
│   │                     #   DrinkWaterSettings, DrinkWaterTask)
│   ├── firebase/         # Firebase Admin SDK setup & FCM helper
│   ├── kafka/            # KafkaJS client, producer (cron tick), consumer (FCM sender)
│   ├── passport_js/      # Passport authentication strategies
│   └── validators/       # Request validation logic
├── docker-compose.yml    # Local Kafka + Zookeeper dev environment
├── .env                  # Environment variables
├── package.json
└── tsconfig.json         # TypeScript configuration
```
