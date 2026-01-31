import { useState, useEffect } from "react";
import { Card, Loader } from "../../ui-components";
import { useAuth } from "../../store/auth.store";
import { 
  User, Mail, Phone, Briefcase, Calendar, 
  MapPin, Users, BookOpen, Award, Shield,
  Edit2, CheckCircle
} from "lucide-react";

export default function StaffProfile() {
  const { auth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [staffData, setStaffData] = useState(null);

  useEffect(() => {
    // In a real app, you'd fetch detailed profile data from API
    // For now, we'll use the data from auth store
    console.log("Staff Profile - Auth data:", auth);
    setStaffData({
      ...auth.details,
      userId: auth.userId,
      username: auth.username,
      role: auth.role,
      campus: auth.campus,
      sections: auth.sections || [],
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
              {staffData?.name?.charAt(0) || auth.username?.charAt(0) || "T"}
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {staffData?.name || "Staff Name"}
              </h1>
              <button className="mt-2 md:mt-0 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 mx-auto md:mx-0">
                <Edit2 size={16} />
                <span>Edit Profile</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm text-gray-600 mt-3">
              <div className="flex items-center gap-2">
                <User size={16} />
                <span>Employee ID: {staffData?.userId || staffData?.employee_id || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase size={16} />
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md font-medium">
                  {staffData?.role?.toUpperCase() || "STAFF"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Personal & Professional Information */}
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
                value={staffData?.email || "Not provided"}
              />
              <InfoItem
                icon={<Phone size={18} />}
                label="Phone Number"
                value={staffData?.phone || "Not provided"}
              />
              <InfoItem
                icon={<Calendar size={18} />}
                label="Date of Birth"
                value={staffData?.dob || staffData?.date_of_birth || "Not provided"}
              />
              <InfoItem
                icon={<User size={18} />}
                label="Gender"
                value={staffData?.gender || "Not provided"}
              />
              <InfoItem
                icon={<MapPin size={18} />}
                label="Address"
                value={staffData?.address || "Not provided"}
                className="md:col-span-2"
              />
            </div>
          </Card>

          {/* Professional Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase size={20} className="text-primary-600" />
              Professional Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem
                icon={<Briefcase size={18} />}
                label="Designation"
                value={staffData?.designation || "Teacher"}
              />
              <InfoItem
                icon={<BookOpen size={18} />}
                label="Department"
                value={staffData?.department || "Not assigned"}
              />
              <InfoItem
                icon={<Award size={18} />}
                label="Qualification"
                value={staffData?.qualification || "Not provided"}
              />
              <InfoItem
                icon={<Calendar size={18} />}
                label="Joining Date"
                value={staffData?.joining_date || staffData?.join_date || "Not provided"}
              />
              <InfoItem
                icon={<User size={18} />}
                label="Employee ID"
                value={staffData?.employee_id || staffData?.userId || "N/A"}
              />
              <InfoItem
                icon={<Briefcase size={18} />}
                label="Employment Type"
                value={staffData?.employment_type || "Full-time"}
              />
            </div>
          </Card>

          {/* Subjects & Classes */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen size={20} className="text-primary-600" />
              Teaching Details
            </h2>
            <div className="space-y-4">
              {/* Subjects Taught */}
              <div>
                <p className="text-sm text-gray-500 mb-2">Subjects Taught</p>
                <div className="flex flex-wrap gap-2">
                  {staffData?.subjects && staffData.subjects.length > 0 ? (
                    staffData.subjects.map((subject, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                      >
                        {subject}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">No subjects assigned</span>
                  )}
                </div>
              </div>

              {/* Classes/Sections Assigned */}
              <div>
                <p className="text-sm text-gray-500 mb-2">Classes Assigned</p>
                <div className="flex flex-wrap gap-2">
                  {staffData?.sections && staffData.sections.length > 0 ? (
                    staffData.sections.map((section) => (
                      <span
                        key={section.id || section.section_id}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                      >
                        {section.name || section.section_name || "Section"}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">No classes assigned</span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Permissions */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield size={20} className="text-primary-600" />
              Permissions & Access
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {staffData?.permissions ? (
                Object.entries(staffData.permissions).map(([key, value]) => (
                  <PermissionItem
                    key={key}
                    label={formatPermissionLabel(key)}
                    hasAccess={value}
                  />
                ))
              ) : (
                <p className="text-sm text-gray-500 col-span-2">No permissions data available</p>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column - Campus & Account Info */}
        <div className="space-y-6">
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
                value={staffData?.campus?.name || auth.campus?.name || "Not assigned"}
              />
              <InfoItem
                icon={<MapPin size={18} />}
                label="Campus ID"
                value={staffData?.campus_id || auth.campus_id || "N/A"}
              />
              <InfoItem
                icon={<Briefcase size={18} />}
                label="Department Location"
                value={staffData?.department_location || "Main Building"}
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
                value={staffData?.username || "N/A"}
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
              <InfoItem
                icon={<Calendar size={18} />}
                label="Last Login"
                value={staffData?.last_login || "Not available"}
              />
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium">
                Change Password
              </button>
              <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                Download Profile
              </button>
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

function PermissionItem({ label, hasAccess }) {
  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
      <CheckCircle
        size={18}
        className={hasAccess ? "text-green-600" : "text-gray-300"}
      />
      <span className={`text-sm ${hasAccess ? "text-gray-900" : "text-gray-400"}`}>
        {label}
      </span>
    </div>
  );
}

function formatPermissionLabel(key) {
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
