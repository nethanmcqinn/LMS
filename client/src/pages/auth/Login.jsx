import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineAcademicCap, HiOutlineLockClosed, HiOutlineEnvelope } from 'react-icons/hi2';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    try {
      setLoading(true);
      const res = await login(email, password);
      toast.success(`Welcome back, ${res.user.firstName}!`);
      if (res.user.role === 'faculty') {
        navigate('/faculty/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white shadow-lg mb-4">
          <HiOutlineAcademicCap className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Academic LMS</h2>
        <p className="mt-2 text-sm text-gray-600">
          Sign in to access your courses, quizzes, and grades
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiOutlineEnvelope className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="user@academic.edu"
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiOutlineLockClosed className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 border-t border-gray-200 pt-6">
            <p className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Quick Demo Accounts (Click to Fill)
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => {
                  setEmail('faculty@demo.edu');
                  setPassword('Password123!');
                }}
                className="w-full py-2 px-3 border border-indigo-200 rounded-lg bg-indigo-50/80 hover:bg-indigo-100 text-xs font-semibold text-indigo-800 transition text-center"
              >
                👨‍🏫 Faculty Demo
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('student@demo.edu');
                  setPassword('Password123!');
                }}
                className="w-full py-2 px-3 border border-emerald-200 rounded-lg bg-emerald-50/80 hover:bg-emerald-100 text-xs font-semibold text-emerald-800 transition text-center"
              >
                👨‍🎓 Student Demo
              </button>
            </div>

            <p className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Or Register New Account
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/register/student"
                className="w-full inline-flex justify-center py-2 px-3 border border-gray-300 rounded-lg shadow-sm bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 transition text-center"
              >
                Student Registration
              </Link>
              <Link
                to="/register/faculty"
                className="w-full inline-flex justify-center py-2 px-3 border border-gray-300 rounded-lg shadow-sm bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 transition text-center"
              >
                Faculty Registration
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

