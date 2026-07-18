# DarshanEase Backend

REST API backend for the DarshanEase temple darshan ticket booking application.

## Tech Stack
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- bcryptjs for password hashing

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root of the backend folder (use `.env.example` as reference):
   ```
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   ```

3. Start the server:
   ```bash
   npm start
   ```
   For development with auto-restart:
   ```bash
   npm run dev
   ```

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register a new user |
| POST | /api/auth/login | Login and get JWT token |

### Bookings (requires Bearer token)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/bookings | Create a new darshan booking |
| GET | /api/bookings | Get all bookings for logged-in user |
| PUT | /api/bookings/:id/cancel | Cancel a booking |
