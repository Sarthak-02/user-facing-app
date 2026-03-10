import { useMemo } from "react";
import { Card } from "../../ui-components";
import { useAuth } from "../../store/auth.store";
import { 
  User, Mail, Phone, GraduationCap, Calendar, 
  MapPin, Users, BookOpen, TrendingUp, Award,
  Heart, AlertCircle, Droplet
} from "lucide-react";

export default function StudentProfile() {
  const { auth } = useAuth();
  
  const studentData = useMemo(() => {
    console.log("Student Profile - Auth data:", auth);
    
    const details = auth.details || {};
    const extras = details.extras || {};
    
    return {
      // Basic Info
      student_id: details.student_id,
      admission_no: details.student_admission_no,
      roll_no: details.student_roll_no,
      photo_url: details.student_photo_url,
      first_name: details.student_first_name,
      middle_name: details.student_middle_name,
      last_name: details.student_last_name,
      full_name: `${details.student_first_name || ''} ${details.student_middle_name || ''} ${details.student_last_name || ''}`.trim(),
      gender: details.student_gender,
      dob: details.student_dob,
      current_status: details.student_current_status,
      
      // Contact Info (from extras)
      email: extras.student_email,
      phone: extras.student_phone,
      
      // Academic Info
      section: details.sections?.[0]?.label || 'Not assigned',
      section_id: details.student_section_id,
      admission_date: extras.student_admission_date,
      category: extras.student_category,
      
      // Guardian Info (from extras)
      father_name: extras.student_father_name,
      mother_name: extras.student_mother_name,
      guardian_name: extras.student_guardian_name,
      guardian_relation: extras.student_guardian_relation,
      primary_contact: extras.student_primary_contact,
      guardian_phone: extras.student_guardian_phone,
      guardian_email: extras.student_guardian_email,
      guardian_address: extras.student_guardian_address,
      guardian_city: extras.student_guardian_city,
      guardian_state: extras.student_guardian_state,
      guardian_country: extras.student_guardian_country,
      guardian_pincode: extras.student_guardian_pincode,
      
      // Emergency Contact
      emergency_contact_name: extras.student_emergency_contact_name,
      emergency_contact_phone: extras.student_emergency_contact_phone,
      
      // Medical Info
      blood_group: extras.student_blood_group,
      medical_conditions: extras.student_medical_conditions,
      
      // Other
      remarks: extras.student_remarks,
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
    <div className="min-h-full bg-gray-50 p-4 md:p-6 space-y-6 pb-20 md:pb-6">
      {/* Header Card */}
      <Card className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Profile Picture */}
          <div className="flex justify-center md:justify-start">
            {studentData?.photo_url ? (
              <img 
                src={studentData.photo_url} 
                alt="Profile" 
                className="h-24 w-24 md:h-32 md:w-32 rounded-full object-cover"
              />
            ) : (
              <div className="h-24 w-24 md:h-32 md:w-32 rounded-full bg-primary-600 text-white flex items-center justify-center text-3xl md:text-4xl font-bold">
                {studentData?.first_name?.charAt(0) || "S"}
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {studentData?.full_name || "Student Name"}
            </h1>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <User size={16} />
                <span>Admission No: <strong>{studentData?.admission_no || "N/A"}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Award size={16} />
                <span>Roll No: <strong>{studentData?.roll_no || "N/A"}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap size={16} />
                <span className={`px-2 py-1 rounded-md font-medium ${getStatusColor(studentData?.current_status)}`}>
                  {studentData?.current_status?.toUpperCase() || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1  gap-6">
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
                icon={<User size={18} />}
                label="First Name"
                value={studentData?.first_name || "Not provided"}
              />
              <InfoItem
                icon={<User size={18} />}
                label="Middle Name"
                value={studentData?.middle_name || "Not provided"}
              />
              <InfoItem
                icon={<User size={18} />}
                label="Last Name"
                value={studentData?.last_name || "Not provided"}
              />
              <InfoItem
                icon={<User size={18} />}
                label="Gender"
                value={studentData?.gender || "Not provided"}
              />
              <InfoItem
                icon={<Calendar size={18} />}
                label="Date of Birth"
                value={formatDate(studentData?.dob)}
              />
              <InfoItem
                icon={<Droplet size={18} />}
                label="Blood Group"
                value={formatBloodGroup(studentData?.blood_group)}
              />
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
                icon={<User size={18} />}
                label="Category"
                value={studentData?.category?.toUpperCase() || "Not provided"}
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
                icon={<Award size={18} />}
                label="Student ID"
                value={studentData?.student_id || "N/A"}
              />
              <InfoItem
                icon={<User size={18} />}
                label="Admission Number"
                value={studentData?.admission_no || "Not assigned"}
              />
              <InfoItem
                icon={<User size={18} />}
                label="Roll Number"
                value={studentData?.roll_no || "Not assigned"}
              />
              <InfoItem
                icon={<GraduationCap size={18} />}
                label="Class/Section"
                value={studentData?.section || "Not assigned"}
              />
              <InfoItem
                icon={<Calendar size={18} />}
                label="Admission Date"
                value={formatDate(studentData?.admission_date)}
              />
              <InfoItem
                icon={<User size={18} />}
                label="Current Status"
                value={
                  <span className={`px-2 py-1 rounded-md text-sm font-medium ${getStatusColor(studentData?.current_status)}`}>
                    {studentData?.current_status?.toUpperCase() || "N/A"}
                  </span>
                }
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
                label="Father's Name"
                value={studentData?.father_name || "Not provided"}
              />
              <InfoItem
                icon={<User size={18} />}
                label="Mother's Name"
                value={studentData?.mother_name || "Not provided"}
              />
              <InfoItem
                icon={<User size={18} />}
                label="Guardian Name"
                value={studentData?.guardian_name || "Not provided"}
              />
              <InfoItem
                icon={<User size={18} />}
                label="Guardian Relationship"
                value={studentData?.guardian_relation || "Not provided"}
              />
              <InfoItem
                icon={<User size={18} />}
                label="Primary Contact"
                value={studentData?.primary_contact?.toUpperCase() || "Not provided"}
              />
              <InfoItem
                icon={<Phone size={18} />}
                label="Guardian Phone"
                value={studentData?.guardian_phone || "Not provided"}
              />
              <InfoItem
                icon={<Mail size={18} />}
                label="Guardian Email"
                value={studentData?.guardian_email || "Not provided"}
              />
              <InfoItem
                icon={<MapPin size={18} />}
                label="Address"
                value={studentData?.guardian_address || "Not provided"}
                className="md:col-span-2"
              />
              <InfoItem
                icon={<MapPin size={18} />}
                label="City"
                value={studentData?.guardian_city || "Not provided"}
              />
              <InfoItem
                icon={<MapPin size={18} />}
                label="State"
                value={studentData?.guardian_state || "Not provided"}
              />
              <InfoItem
                icon={<MapPin size={18} />}
                label="Country"
                value={studentData?.guardian_country || "Not provided"}
              />
              <InfoItem
                icon={<MapPin size={18} />}
                label="Pincode"
                value={studentData?.guardian_pincode || "Not provided"}
              />
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
                value={studentData?.emergency_contact_name || "Not provided"}
              />
              <InfoItem
                icon={<Phone size={18} />}
                label="Emergency Contact Phone"
                value={studentData?.emergency_contact_phone || "Not provided"}
              />
              <InfoItem
                icon={<Heart size={18} />}
                label="Medical Conditions"
                value={studentData?.medical_conditions || "None"}
                className="md:col-span-2"
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
