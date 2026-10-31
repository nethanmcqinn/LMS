import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import FacultyLayout from './components/layouts/FacultyLayout';
import StudentLayout from './components/layouts/StudentLayout';

// Auth pages
import Login from './pages/auth/Login';
import RegisterStudent from './pages/auth/RegisterStudent';
import RegisterFaculty from './pages/auth/RegisterFaculty';

// Faculty pages
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import ProgramManagement from './pages/faculty/ProgramManagement';
import AcademicYearManagement from './pages/faculty/AcademicYearManagement';
import CourseManagement from './pages/faculty/CourseManagement';
import CourseOfferingList from './pages/faculty/CourseOfferingList';
import CourseOfferingDetail from './pages/faculty/CourseOfferingDetail';
import LessonManagement from './pages/faculty/LessonManagement';
import QuizManagement from './pages/faculty/QuizManagement';
import StudentManagement from './pages/faculty/StudentManagement';
import StudentDetail from './pages/faculty/StudentDetail';
import Gradebook from './pages/faculty/Gradebook';
import GradebookDetail from './pages/faculty/GradebookDetail';

// Student pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentCourses from './pages/student/StudentCourses';
import StudentCourseDetail from './pages/student/StudentCourseDetail';
import StudentLesson from './pages/student/StudentLesson';
import QuizAttempt from './pages/student/QuizAttempt';
import QuizResult from './pages/student/QuizResult';
import StudentGrades from './pages/student/StudentGrades';
import StudentProgress from './pages/student/StudentProgress';
import StudentProfile from './pages/student/StudentProfile';

const AppRoutes = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={isAuthenticated ? <Navigate to={user?.role === 'faculty' ? '/faculty/dashboard' : '/student/dashboard'} /> : <Login />} />
      <Route path="/register/student" element={isAuthenticated ? <Navigate to="/student/dashboard" /> : <RegisterStudent />} />
      <Route path="/register/faculty" element={isAuthenticated ? <Navigate to="/faculty/dashboard" /> : <RegisterFaculty />} />

      {/* Faculty routes */}
      <Route path="/faculty/*" element={
        <ProtectedRoute role="faculty">
          <FacultyLayout>
            <Routes>
              <Route path="dashboard" element={<FacultyDashboard />} />
              <Route path="programs" element={<ProgramManagement />} />
              <Route path="academic-years" element={<AcademicYearManagement />} />
              <Route path="courses" element={<CourseManagement />} />
              <Route path="course-offerings" element={<CourseOfferingList />} />
              <Route path="course-offerings/:id" element={<CourseOfferingDetail />} />
              <Route path="course-offerings/:id/lessons" element={<LessonManagement />} />
              <Route path="course-offerings/:id/quizzes/:lessonId" element={<QuizManagement />} />
              <Route path="students" element={<StudentManagement />} />
              <Route path="students/:id" element={<StudentDetail />} />
              <Route path="gradebook" element={<Gradebook />} />
              <Route path="gradebook/:courseOfferingId" element={<GradebookDetail />} />
            </Routes>
          </FacultyLayout>
        </ProtectedRoute>
      } />

      {/* Student routes */}
      <Route path="/student/*" element={
        <ProtectedRoute role="student">
          <StudentLayout>
            <Routes>
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="courses" element={<StudentCourses />} />
              <Route path="courses/:id" element={<StudentCourseDetail />} />
              <Route path="courses/:courseOfferingId/lessons/:lessonId" element={<StudentLesson />} />
              <Route path="quiz/:quizId" element={<QuizAttempt />} />
              <Route path="quiz-result/:attemptId" element={<QuizResult />} />
              <Route path="grades" element={<StudentGrades />} />
              <Route path="progress" element={<StudentProgress />} />
              <Route path="profile" element={<StudentProfile />} />
            </Routes>
          </StudentLayout>
        </ProtectedRoute>
      } />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { background: '#363636', color: '#fff' },
            success: { style: { background: '#059669' } },
            error: { style: { background: '#DC2626' }, duration: 5000 },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;

