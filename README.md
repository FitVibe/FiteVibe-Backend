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
  - [Sign Up](#1-sign-up)
  - [Sign In](#2-sign-in)
  - [Current User](#3-current-user)
  - [Logout](#4-logout)
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

## 📁 Project Structure

```text
FiteVibe-Backend/
├── app/
│   ├── controllers/      # Route controllers (AuthController, etc.)
│   ├── routes/           # Express router definitions
│   ├── services/         # Business logic layer (UserService, etc.)
│   └── index.ts          # Express app entry point
├── domain/
│   ├── entities/         # TypeScript interfaces & domain entities
│   ├── types/            # Global declaration types (.d.ts)
│   └── validator/        # Validation contracts
├── infrastructure/
│   ├── database/         # Mongoose models & database connection setup
│   ├── passport_js/      # Passport authentication strategies
│   └── validators/       # Request validation logic
├── .env                  # Environment variables
├── package.json
└── tsconfig.json         # TypeScript configuration
```
