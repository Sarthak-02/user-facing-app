import { useState, useEffect } from "react";
import { Card, Loader } from "../../ui-components";
import { useAuth } from "../../store/auth.store";
import { 
  User, Mail, Phone, GraduationCap, Calendar, 
  MapPin, Users, BookOpen, TrendingUp, Award,
  Edit2
} from "lucide-react";

export default function StudentProfile() {
  const { auth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [studentData, setStudentData] = useState(null);

  useEffect(() => {
    // In a real app, you'd fetch detailed profile data from API
    // For now, we'll use the data from auth store
    console.log("Student Profile - Auth data:", auth);
    setStudentData({
      ...auth.details,
      userId: auth.userId,
      username: auth.username,
      role: auth.role,
      campus: auth.campus,
    });
  }, [auth]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-6">
      {/* Header Card */}
      <Card className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Profile Picture */}
          <div className="flex justify-center md:justify-start">
            <div className="h-24 w-24 md:h-32 md:w-32 rounded-full bg-primary-600 text-white flex items-center justify-center text-3xl md:text-4xl font-bold">
              {studentData?.name?.charAt(0) || auth.username?.charAt(0) || "S"}
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {studentData?.name || "Student Name"}
              </h1>
              <button className="mt-2 md:mt-0 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 mx-auto md:mx-0">
                <Edit2 size={16} />
                <span>Edit Profile</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm text-gray-600 mt-3">
              <div className="flex items-center gap-2">
                <User size={16} />
                <span>Student ID: {studentData?.userId || studentData?.student_id || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap size={16} />
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md font-medium">
                  {studentData?.role?.toUpperCase() || "STUDENT"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Personal Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Details */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User size={20} className="text-primary-600" />
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem
                icon={<Mail size={18} />}
                label="Email"
                value={studentData?.email || "Not provided"}
              />
              <InfoItem
                icon={<Phone size={18} />}
                label="Phone Number"
                value={studentData?.phone || "Not provided"}
              />
              <InfoItem
                icon={<Calendar size={18} />}
                label="Date of Birth"
                value={studentData?.dob || studentData?.date_of_birth || "Not provided"}
              />
              <InfoItem
                icon={<User size={18} />}
                label="Gender"
                value={studentData?.gender || "Not provided"}
              />
              <InfoItem
                icon={<MapPin size={18} />}
                label="Address"
                value={studentData?.address || "Not provided"}
                className="md:col-span-2"
              />
            </div>
          </Card>

          {/* Academic Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen size={20} className="text-primary-600" />
              Academic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem
                icon={<GraduationCap size={18} />}
                label="Class"
                value={studentData?.class || "Not assigned"}
              />
              <InfoItem
                icon={<Users size={18} />}
                label="Section"
                value={studentData?.section || "Not assigned"}
              />
              <InfoItem
                icon={<Calendar size={18} />}
                label="Academic Year"
                value={studentData?.academic_year || "2024-2025"}
              />
              <InfoItem
                icon={<Calendar size={18} />}
                label="Admission Date"
                value={studentData?.admission_date || "Not provided"}
              />
              <InfoItem
                icon={<User size={18} />}
                label="Roll Number"
                value={studentData?.roll_number || studentData?.roll_no || "Not assigned"}
              />
              <InfoItem
                icon={<Award size={18} />}
                label="Student ID"
                value={studentData?.student_id || studentData?.userId || "N/A"}
              />
            </div>
          </Card>

          {/* Parent/Guardian Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users size={20} className="text-primary-600" />
              Parent/Guardian Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem
                icon={<User size={18} />}
                label="Parent Name"
                value={studentData?.parent_name || studentData?.guardian_name || "Not provided"}
              />
              <InfoItem
                icon={<Phone size={18} />}
                label="Parent Phone"
                value={studentData?.parent_phone || studentData?.guardian_phone || "Not provided"}
              />
              <InfoItem
                icon={<Mail size={18} />}
                label="Parent Email"
                value={studentData?.parent_email || studentData?.guardian_email || "Not provided"}
              />
              <InfoItem
                icon={<User size={18} />}
                label="Relationship"
                value={studentData?.guardian_relation || "Parent"}
              />
            </div>
          </Card>
        </div>

        {/* Right Column - Quick Stats & Campus Info */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-primary-600" />
              Quick Stats
            </h2>
            <div className="space-y-4">
              <StatCard
                label="Overall Attendance"
                value={studentData?.attendance_percentage || "N/A"}
                icon={<Calendar size={24} />}
                color="bg-green-100 text-green-600"
              />
              <StatCard
                label="Pending Homework"
                value={studentData?.pending_homework || "0"}
                icon={<BookOpen size={24} />}
                color="bg-orange-100 text-orange-600"
              />
              <StatCard
                label="Upcoming Exams"
                value={studentData?.upcoming_exams || "0"}
                icon={<Award size={24} />}
                color="bg-blue-100 text-blue-600"
              />
            </div>
          </Card>

          {/* Campus Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin size={20} className="text-primary-600" />
              Campus Information
            </h2>
            <div className="space-y-3">
              <InfoItem
                icon={<MapPin size={18} />}
                label="Campus"
                value={studentData?.campus?.name || auth.campus?.name || "Not assigned"}
              />
              <InfoItem
                icon={<MapPin size={18} />}
                label="Campus ID"
                value={studentData?.campus_id || auth.campus_id || "N/A"}
              />
            </div>
          </Card>

          {/* Account Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User size={20} className="text-primary-600" />
              Account Info
            </h2>
            <div className="space-y-3">
              <InfoItem
                icon={<User size={18} />}
                label="Username"
                value={studentData?.username || "N/A"}
              />
              <InfoItem
                icon={<Calendar size={18} />}
                label="Account Status"
                value={
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-sm font-medium">
                    Active
                  </span>
                }
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function InfoItem({ icon, label, value, className = "" }) {
  return (
    <div className={`flex gap-3 ${className}`}>
      <div className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-sm font-medium text-gray-900 break-words">
          {typeof value === "string" ? value : value}
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
      <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-600">{label}</p>
      </div>
    </div>
  );
}
