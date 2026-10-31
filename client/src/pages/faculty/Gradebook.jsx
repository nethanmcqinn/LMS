import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineChartBarSquare,
  HiOutlineAcademicCap,
  HiOutlineArrowRight,
  HiOutlineUserGroup,
} from 'react-icons/hi2';

const Gradebook = () => {
  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOfferings();
  }, []);

  const fetchOfferings = async () => {
    try {
      const res = await api.get('/course-offerings');
      setOfferings(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load courses for gradebook');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faculty Gradebook</h1>
          <p className="text-sm text-gray-500">
            Select a class section to view student quiz score matrices, enter course grades, and record academic remarks
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-gray-500">Loading gradebook sections...</div>
        ) : offerings.length === 0 ? (
          <div className="col-span-3 text-center py-12 bg-white rounded-xl border border-gray-100 text-gray-500">
            No active class offerings assigned. Create a class offering first to access its gradebook.
          </div>
        ) : (
          offerings.map((offering) => (
            <div
              key={offering._id}
              className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md">
                    {offering.course?.courseCode}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                    {offering.section}
                  </span>
                </div>

                <h3 className="text-base font-bold text-gray-900 leading-snug">
                  {offering.course?.courseTitle}
                </h3>

                <p className="text-xs text-gray-500 mt-2">
                  {offering.semester?.name} • A.Y. {offering.academicYear?.yearStart}-
                  {offering.academicYear?.yearEnd}
                </p>

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <HiOutlineUserGroup className="w-4 h-4 text-indigo-600" />
                    {offering.enrolledCount || 0} Students Enrolled
                  </span>
                  <span>{offering.lessonCount || 0} Lessons</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <Link
                  to={`/faculty/gradebook/${offering._id}`}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                >
                  <HiOutlineChartBarSquare className="w-4 h-4" />
                  Open Class Gradebook
                  <HiOutlineArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Gradebook;

