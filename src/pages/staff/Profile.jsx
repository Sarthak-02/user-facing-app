import { useMemo, useState } from "react";
import { Card } from "../../ui-components";
import { useAuth } from "../../store/auth.store";
import { 
  User, Mail, Phone, Briefcase, Calendar, 
  MapPin, Users, BookOpen, Award, Shield,
  CheckCircle, Droplet, Heart, AlertCircle, Key
} from "lucide-react";
import ChangePasswordModal from "../../components/ChangePasswordModal";

export default function StaffProfile() {
  const { auth } = useAuth();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  
  const staffData = useMemo(() => {
    console.log("Staff Profile - Auth data:", auth);
    
    const details = auth.details || {};
    const extras = details.extras || {};
    
    return {
      // Basic Info
      staff_id: details.staff_id || details.teacher_id,
      employee_code: details.staff_employee_code || details.teacher_employee_code,
      photo_url: details.staff_photo_url || details.teacher_photo_url,
      first_name: details.staff_first_name || details.teacher_first_name,
      middle_name: details.staff_middle_name || details.teacher_middle_name,
      last_name: details.staff_last_name || details.teacher_last_name,
      full_name: `${details.staff_first_name || details.teacher_first_name || ''} ${details.staff_middle_name || details.teacher_middle_name || ''} ${details.staff_last_name || details.teacher_last_name || ''}`.trim(),
      gender: details.staff_gender || details.teacher_gender,
      dob: details.staff_dob || details.teacher_dob,
      current_status: details.staff_status || details.teacher_status,
    
      // Contact Info
      email: details.staff_email || details.teacher_email,
      phone: details.staff_phone || details.teacher_phone,
      
      // Professional Info (from extras)
      designation: extras.staff_designation || extras.teacher_designation,
      department: extras.staff_department || extras.teacher_department,
      qualification: extras.staff_qualification || extras.teacher_qualification,
      joining_date: extras.staff_doj || extras.teacher_doj,
      employment_type: extras.staff_employment_type || extras.teacher_employment_type,
      teacher_role: extras.staff_role || extras.teacher_role,
      
      // Address Info (from extras)
      address: extras.staff_address_line || extras.teacher_address_line,
      city: extras.staff_city || extras.teacher_city,
      state: extras.staff_state || extras.teacher_state,
      country: extras.staff_country || extras.teacher_country,
      pincode: extras.staff_pincode || extras.teacher_pincode,
      
      // Emergency Contact
      emergency_contact_name: extras.staff_emergency_contact_name || extras.teacher_emergency_contact_name,
      emergency_contact_phone: extras.staff_emergency_contact_phone || extras.teacher_emergency_contact_phone,
      emergency_contact_relation: extras.staff_emergency_contact_relation || extras.teacher_emergency_contact_relation,
      
      // Medical Info
      blood_group: extras.staff_blood_group || extras.teacher_blood_group,
      medical_conditions: extras.staff_medical_conditions || extras.teacher_medical_conditions,
      
      // Teaching/Assignment Info
      subjects: extras.teacher_subjects || extras.staff_subjects || details.subjects || extras.subjects || [],
      sections: details.sections || auth.sections || [],
      
      // Permissions
      permissions: details.permissions || extras.permissions,
      
      // Other
      remarks: extras.staff_remarks || extras.teacher_remarks,
      campus_id: details.campus_id,
      campus: auth.campus,
      username: auth.username,
      role: auth.role,
    };
  }, [auth]);

  const formatDate = (dateString) => {
    if (!dateString) return "Not provided";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatBloodGroup = (bloodGroup) => {
    if (!bloodGroup) return "Not provided";
    const bloodGroupMap = {
      'a_plus': 'A+',
      'a_minus': 'A-',
      'b_plus': 'B+',
      'b_minus': 'B-',
      'o_plus': 'O+',
      'o_minus': 'O-',
      'ab_plus': 'AB+',
      'ab_minus': 'AB-'
    };
    return bloodGroupMap[bloodGroup] || bloodGroup;
  };

  const getStatusColor = (status) => {
    if (status === 'active') return 'bg-green-100 text-green-700';
    if (status === 'inactive') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-full bg-[var(--color-background)] p-4 md:p-6 space-y-6 pb-20 md:pb-6">
      {/* Header Card */}
      <Card className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Profile Picture */}
          <div className="flex justify-center md:justify-start">
            {staffData?.photo_url ? (
              <img 
                src={staffData.photo_url} 
                alt="Profile" 
                className="h-24 w-24 md:h-32 md:w-32 rounded-full object-cover"
              />
            ) : (
              <div className="h-24 w-24 md:h-32 md:w-32 rounded-full bg-primary-600 text-white flex items-center justify-center text-3xl md:text-4xl font-bold">
                {staffData?.first_name?.charAt(0) || "T"}
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {staffData?.full_name || "Staff Name"}
            </h1>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <User size={16} />
                <span>Employee Code: <strong>{staffData?.employee_code || "N/A"}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase size={16} />
                <span>{staffData?.designation || "Staff"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-md font-medium ${getStatusColor(staffData?.current_status)}`}>
                  {staffData?.current_status?.toUpperCase() || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Change Password Button */}
          <div className="flex justify-center md:justify-end items-start">
            <button
              onClick={() => setChangePasswordOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:opacity-90 transition text-sm font-medium"
            >
              <Key size={18} />
              Change Password
            </button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1  gap-6">
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
                icon={<User size={18} />}
                label="First Name"
                value={staffData?.first_name || "Not provided"}
              />
              <InfoItem
                icon={<User size={18} />}
                label="Middle Name"
                value={staffData?.middle_name || "Not provided"}
              />
              <InfoItem
                icon={<User size={18} />}
                label="Last Name"
                value={staffData?.last_name || "Not provided"}
              />
              <InfoItem
                icon={<User size={18} />}
                label="Gender"
                value={staffData?.gender || "Not provided"}
              />
              <InfoItem
                icon={<Calendar size={18} />}
                label="Date of Birth"
                value={formatDate(staffData?.dob)}
              />
              <InfoItem
                icon={<Droplet size={18} />}
                label="Blood Group"
                value={formatBloodGroup(staffData?.blood_group)}
              />
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
                icon={<MapPin size={18} />}
                label="Address"
                value={staffData?.address || "Not provided"}
                className="md:col-span-2"
              />
              <InfoItem
                icon={<MapPin size={18} />}
                label="City"
                value={staffData?.city || "Not provided"}
              />
              <InfoItem
                icon={<MapPin size={18} />}
                label="State"
                value={staffData?.state || "Not provided"}
              />
              <InfoItem
                icon={<MapPin size={18} />}
                label="Country"
                value={staffData?.country || "Not provided"}
              />
              <InfoItem
                icon={<MapPin size={18} />}
                label="Pincode"
                value={staffData?.pincode || "Not provided"}
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
                icon={<Award size={18} />}
                label="Staff ID"
                value={staffData?.staff_id || "N/A"}
              />
              <InfoItem
                icon={<User size={18} />}
                label="Employee Code"
                value={staffData?.employee_code || "Not assigned"}
              />
              <InfoItem
                icon={<Briefcase size={18} />}
                label="Designation"
                value={staffData?.designation || "Not provided"}
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
                value={formatDate(staffData?.joining_date)}
              />
              <InfoItem
                icon={<Briefcase size={18} />}
                label="Employment Type"
                value={staffData?.employment_type || "Not provided"}
              />
              <InfoItem
                icon={<User size={18} />}
                label="Current Status"
                value={
                  <span className={`px-2 py-1 rounded-md text-sm font-medium ${getStatusColor(staffData?.current_status)}`}>
                    {staffData?.current_status?.toUpperCase() || "N/A"}
                  </span>
                }
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
                        {typeof subject === 'string' ? subject : subject.label || subject.name || 'Subject'}
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
                    staffData.sections.map((section, index) => (
                      <span
                        key={section.value || index}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                      >
                        {section.label || section.name || section.section_name || "Section"}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">No classes assigned</span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Emergency Contact & Medical Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-primary-600" />
              Emergency Contact & Medical Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem
                icon={<User size={18} />}
                label="Emergency Contact Name"
                value={staffData?.emergency_contact_name || "Not provided"}
              />
              <InfoItem
                icon={<Phone size={18} />}
                label="Emergency Contact Phone"
                value={staffData?.emergency_contact_phone || "Not provided"}
              />
              <InfoItem
                icon={<User size={18} />}
                label="Emergency Contact Relation"
                value={staffData?.emergency_contact_relation || "Not provided"}
              />
              <InfoItem
                icon={<Heart size={18} />}
                label="Medical Conditions"
                value={staffData?.medical_conditions || "None"}
                className="md:col-span-2"
              />
            </div>
          </Card>

          {/* Permissions */}
          {staffData?.permissions && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield size={20} className="text-primary-600" />
                Permissions & Access
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(staffData.permissions).map(([key, value]) => (
                  <PermissionItem
                    key={key}
                    label={formatPermissionLabel(key)}
                    hasAccess={value}
                  />
                ))}
              </div>
            </Card>
          )}
        </div>

      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal 
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
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
