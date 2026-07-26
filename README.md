# 📚 Ink & Key

Ink & Key is a full-stack social book club platform that enables readers to discuss books without spoilers by filtering discussions according to each member's reading progress.

The platform allows readers to join book clubs, track their personal reading progress, participate in discussions, vote on future books, and share opinions—all while preventing spoilers.

Unlike traditional book clubs, every discussion is filtered according to each member's reading progress, allowing readers at different stages of the same book to safely participate in the same community.

---

# ✨ Main Features

- User registration and authentication
- Google Sign-In
- User profiles
- Create and join book clubs
- Current and previous club books
- Reading progress tracking
- Spoiler-free discussions and threaded replies
- Whole-book spoiler-free reviews
- Book voting system
- Book ratings
- Profile and club image uploads using Cloudinary
- Club archiving
- User soft delete
- Responsive interface

---

# 🔒 Spoiler-Free Discussion System

The core feature of Ink & Key is its spoiler prevention system.

Every discussion and reply is associated with a chapter number (or marked as a spoiler-free whole-book review).

Each member has an individual reading progress record for every book.

When a user requests discussions, the backend compares the authenticated user's reading progress with the chapter associated with each discussion before sending the response.

This ensures that users only receive content they are allowed to see, preventing spoilers while allowing members reading at different paces to participate in the same club.

---

# 🛠 Tech Stack

## Frontend

- React
- React Router
- Context API
- Redux Toolkit
- Axios
- Tailwind CSS

## Backend

- Node.js
- Express
- MongoDB
- Mongoose
- JWT Authentication
- bcrypt
- JOI Validation
- Multer
- Cloudinary
- Google Books API
- Google OAuth

---

# 🏗 Architecture

The application follows a client-server architecture where a React frontend communicates with an Express REST API, which manages the business logic and stores data in MongoDB.

---

# 📁 Project Structure

```text
client/
├── src/
│   ├── assets/
│   ├── components/
│   ├── context/
│   ├── hooks/
│   ├── pages/
│   ├── services/
│   ├── store/
│   └── utils/

server/
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── utils/
└── validation/
```

---

# 🚀 Getting Started

## Clone the repository

```bash
git clone <repository-url>
```

## Install dependencies

### Server

```bash
cd server
npm install
```

### Client

```bash
cd client
npm install
```

## Configure environment variables

Create `.env` files in both the `server` and `client` directories using the provided `.env.example` files.

## Start the application

### Backend

```bash
cd server
npm run dev
```

The backend runs on:

```text
http://localhost:5000
```

### Frontend

```bash
cd client
npm run dev
```

The frontend runs on:

```text
http://localhost:5173
```

---

# 🌐 Main API Resources

- `/api/auth`
- `/api/users`
- `/api/clubs`
- `/api/books`
- `/api/comments`
- `/api/polls`
- `/api/reading-progress`
- `/api/uploads`

---

# ☁️ Deployment

**Frontend**

https://ink-and-key.vercel.app/

**Backend**

https://ink-and-key-api.onrender.com

---

# 👩‍💻 Developer

**Eden Eyov**

---

# 📖 Course

Final project developed for the **Advanced Full Stack Development** course.
