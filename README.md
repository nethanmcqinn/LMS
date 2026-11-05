# Learning Management System (LMS) — Setup & Run Guide

This guide contains everything you need to set up and run this LMS system on any laptop or computer from scratch.

---

## 1. What You Need to Install (Prerequisites)

Before running the project on your laptop, ensure you have:

1. **Node.js (LTS version 18 or 20+)**
   - Download & Install from: **[https://nodejs.org/](https://nodejs.org/)**
   - Choose the **LTS (Recommended for Most Users)** installer.
   - To verify it's installed, open PowerShell or Command Prompt and run:
     ```bash
     node -v
     npm -v
     ```
2. **MongoDB Atlas**
  - Create a cluster at [MongoDB Atlas](https://www.mongodb.com/atlas), add your deployment IP access rule, and create a database user.
  - The backend uses `MONGODB_URI` for persistent storage. The in-memory database fallback is only used for local development when that variable is omitted.

---

## 2. Quick Start (How to Run on Your Laptop)

When you copy or clone this `LMS` folder to your laptop, follow these steps:

### Step 1: Install Dependencies

Open a terminal or PowerShell in the `LMS` project folder:

```bash
# 1. Install Backend Dependencies
cd server
npm install

# 2. Install Frontend Dependencies
cd ../client
npm install
```

---

### Step 2: Configure Environment Variables

1. Go to the `server` folder.
2. Ensure you have a `.env` file (if missing, copy `.env.example` to `.env`):
   ```env
   PORT=5000
  MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lms
  JWT_SECRET=replace_with_a_long_random_secret
   JWT_EXPIRE=7d
   MAX_FILE_SIZE=10485760
   UPLOAD_PATH=./uploads
  CLIENT_URL=http://localhost:5173
   ```

---

### Step 3: Start the Backend Server

Open your first terminal window:

```bash
cd server
node server.js
```

You should see:
```
Server running on port 5000
MongoDB Connected: cluster0...
Initial academic programs, academic years, semesters, and courses seeded successfully!
Demo accounts (faculty@demo.edu and student@demo.edu) seeded successfully!
```

---

### Step 4: Start the Frontend Client

Open a **second** terminal window:

```bash
cd client
npm run dev
```

You should see:
```
  VITE ready in ... ms
  ➜  Local:   http://localhost:5173/
```

Open your browser and navigate to: **`http://localhost:5173`**

---

## 3. Deploying with Render and Vercel

### Render backend

- Create a Web Service with the `server` directory as its root directory.
- Build command: `npm install`
- Start command: `npm start`
- Add `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRE=7d`, and `CLIENT_URL=https://your-vercel-app.vercel.app` as environment variables.
- Add the Render service URL to MongoDB Atlas Network Access if your Atlas rules require it.

### Vercel frontend

- Create a Vercel project with the `client` directory as its root directory.
- Build command: `npm run build`
- Add `VITE_API_URL=https://your-render-service.onrender.com/api` as an environment variable.
- Redeploy after setting the variable so the client sends requests to Render instead of its local Vite proxy.

---

## 4. Ready-To-Use Demo Accounts

You can log in immediately using these pre-seeded accounts:

### 👨‍🏫 Faculty Account (Instructor)
- **Email:** `faculty@demo.edu`
- **Password:** `Password123!`
- **Role:** Faculty (Prof. Alan Turing)
- **Features you can test:**
  - View **Faculty Dashboard** metrics and completion charts.
  - Manage **My Classes** (`IT101 - BSIT 1-A`).
  - Upload lessons, reading notes, and attachments (PDF, DOCX, PPTX, Images, Video).
  - Create and configure quizzes (passing percentage, attempt limits, question types).
  - Open the **Gradebook Matrix** to view student scores and assign grades.
  - Reset student progress if academic remediation is needed.

### 👨‍🎓 Student Account (Learner)
- **Email:** `student@demo.edu`
- **Password:** `Password123!`
- **Role:** Student (Juan Dela Cruz)
- **Student ID:** `2026-BSIT-0001`
- **Features you can test:**
  - View **Student Dashboard** and enrolled classes.
  - Sequential progression: **Module 1** is Available, while **Module 2** is 🔒 **Locked**.
  - Take the **Module 1 Assessment**:
    - Score $\ge 75\%$ to immediately unlock **Module 2**!
  - View official grade reports and academic profile.

---

## 5. Key Academic Features Implemented

1. **Structured Student ID Generation:**
   - Follows `YYYY-PROGRAMCODE-SEQUENCE` (e.g. `2026-BSIT-0001`).
   - Uses MongoDB atomic `$inc` operations to prevent duplicate IDs.
   - Student IDs are permanent throughout the student's entire academic career.
2. **Sequential Lesson Progression:**
   - Enforced by the backend (`HTTP 403 Forbidden` if attempting to bypass or access locked modules).
   - Students cannot view locked content until the preceding module's quiz is passed.
3. **Server-Side Grading:**
   - Correct answers are stripped from the quiz before sending to students.
   - Evaluated strictly on the server upon submission.
4. **Faculty Gradebook & Progress Reset:**
   - Full matrix of student scores across all quizzes.
   - Instructors can reset progress with an audit log in `ProgressResetLog`.

---

## 5. Troubleshooting Common Issues

- **Port 5000 or 5173 already in use:**
  - You can change `PORT=5000` to another port (e.g., `5001`) in `server/.env`.
  - If changing the backend port, update the proxy in `client/vite.config.js`.
- **Command 'node' not recognized:**
  - Node.js is not added to your system `PATH`. Restart your terminal or reinstall Node.js with default settings.
- **Run the automated test suite:**
  - To test all 28 core scenarios and progression rules:
    ```bash
    node server/tests/e2eTest.js
    ```
