# Academic Learning Management System (LMS)

A full-stack, enterprise-grade academic Learning Management System built with the **MERN** stack (MongoDB, Express.js, React.js, Node.js) and Tailwind CSS. The system implements authentic academic institution hierarchies, sequential learning progression with prerequisite quiz completion, atomic student ID generation, and comprehensive faculty gradebooks.

---

## 🏛️ Academic Hierarchy & Structure

The system is architected around real-world collegiate workflows:

```
Institution
 ├── Academic Years (e.g., 2026-2027) [with active period selection]
 ├── Semesters (First Semester, Second Semester, Summer)
 ├── Degree Programs (e.g., BSIT, BSCS, BSIS)
 │    ├── Program Code & Name
 │    └── Allowed Year Levels (1st to 4th Year)
 ├── Course Subjects Catalog (e.g., IT101, CS102)
 ├── Course Offerings (Scheduled sections assigned to Faculty)
 │    ├── Enrolled Students
 │    └── Curriculum Lessons
 │         ├── Rich Notes, Video Links, and File Attachments
 │         └── Lesson Quizzes (Passing % threshold requirement)
 └── Gradebooks & Academic Records
```

---

## 👥 User Roles & Access Control

The LMS strictly implements **exactly TWO user roles**:

1. **Faculty**
   - Manage degree programs, academic years, semesters, and course subjects
   - Create course offerings and assign sections
   - Enroll students individually or via bulk enrollment
   - Upload and reorder sequential lessons with attachments (PDF, DOCX, PPTX, Images, Video)
   - Create and configure quizzes with customizable passing scores, attempt limits, and 3 question types (Multiple Choice, True/False, Identification)
   - Access the class gradebook matrix with student quiz scores, overall grades, and instructor remarks
   - Audit and reset student lesson progress when remediation is required

2. **Student**
   - Access verified student academic profile displaying their permanent Student ID
   - View enrolled course offerings and curriculum modules
   - Engage with sequential lessons: **Lesson progression is strictly enforced by the backend** (Lesson 2 remains locked until the student achieves a passing score on Quiz 1)
   - Take interactive quizzes with real-time countdown timers
   - Instant automated grading evaluated on the backend (preventing client-side tampering)
   - Review academic grades, quiz attempts history, and overall progress

---

## 🆔 Structured Student ID Generation

Student registration automatically generates an official, immutable academic identifier:

$$\text{Format: } \mathbf{YYYY-PROGRAMCODE-SEQUENCE}$$

- **Example**: `2026-BSIT-0001`, `2026-BSIT-0002`, `2026-BSCS-0001`
- **Concurrency Safety**: Utilizes MongoDB atomic `$inc` operations via `findOneAndUpdate` on dedicated counter collections to prevent race conditions and duplicate IDs.
- **Academic Persistence**: The student ID is permanent and retained even when the student advances across year levels.

---

## 🔒 Sequential Lesson Progression Engine

The hallmark feature of the LMS is the **backend-enforced learning progression engine**:

1. **Initial Access**: When enrolled in a course, Lesson 1 is unlocked (`available`). All subsequent lessons default to `locked`.
2. **Server-Side Authorization**: Students cannot bypass locked lessons by entering direct URLs or invoking API endpoints directly (`/api/lessons/:id` returns `HTTP 403 Forbidden`).
3. **Automated Assessment**:
   - The student takes the quiz associated with the current lesson.
   - Answers are evaluated entirely on the server (correct answers are never sent to the client during test-taking).
   - The system calculates the score percentage and compares it against the faculty-configured passing threshold (e.g. 75%).
4. **Progression Milestone**:
   - **Passed**: The current lesson transitions to `completed`, and the next sequential lesson in order is automatically unlocked (`available`).
   - **Failed**: The subsequent lesson remains `locked`. The student may retake the quiz subject to remaining allowed attempts.
5. **Remediation & Audit**: Faculty members can reset a student's progress on a module, automatically recording an audit log entry in `ProgressResetLog` and relocking subsequent modules.

---

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js, MongoDB (with Mongoose ORM and embedded MongoMemoryServer for immediate zero-config setup)
- **Frontend**: React.js (Vite), Tailwind CSS, React Router v7, React Hook Form, React Hot Toast, Recharts, React Icons
- **Security**: JWT Authentication, bcryptjs password hashing, role-based middleware, and server-side evaluation

---

## 🚀 Running the Application

### 1. Prerequisites
Ensure [Node.js](https://nodejs.org/) (v18+) is installed.

### 2. Backend Server
```bash
cd server
npm install
node server.js
```
The server will start on `http://localhost:5000`. If local MongoDB is not running, it automatically boots an embedded in-memory MongoDB instance with pre-seeded degree programs (BSIT, BSCS, BSIS), Academic Year (2026-2027), and Course Subjects!

### 3. Frontend Client
```bash
cd client
npm install
npm run dev
```
The application will be accessible at `http://localhost:5173`.

### 4. Running the Automated Test Suite
To run the automated end-to-end integration test suite verifying all 28 requirements:
```bash
node server/tests/e2eTest.js
```

---

## 🧪 Verified Test Scenarios

The test suite automatically tests and confirms:
1. Student registration generates correct `YYYY-PROGRAMCODE-SEQUENCE` format.
2. Concurrent registrations prevent duplicate student IDs.
3. Student ID remains unchanged across year levels.
4. Faculty course offering scheduling.
5. Course enrollment authorization.
6. Lesson creation & quiz creation with custom passing scores.
7. Backend restriction of locked lessons (HTTP 403).
8. Server-side grading of failed attempts keeping modules locked.
9. Server-side grading of passed attempts unlocking subsequent modules.
10. Gradebook updates and instructor remarks.
11. Unauthorized grade modification prevention.
12. Private academic record protection.
13. Session persistence of lesson progression.

