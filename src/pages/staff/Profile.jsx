import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../ui-components";
import { useAuth } from "../../store/auth.store";
import {
  User, Mail, Phone, Briefcase, Calendar,
  MapPin, BookOpen, Award, Shield,
  CheckCircle, Droplet, Heart, AlertCircle, Key,
  Building2, GraduationCap, Clock, BadgeCheck
} from "lucide-react";
import ChangePasswordModal from "../../components/ChangePasswordModal";

export default function StaffProfile() {
  const { t } = useTranslation();
  const { auth } = useAuth();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const staffData = useMemo(() => {
    const details = auth.details || {};
    const extras = details.extras || {};

    return {
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
      email: details.staff_email || details.teacher_email,
      phone: details.staff_phone || details.teacher_phone,
      designation: extras.staff_designation || extras.teacher_designation,
      department: extras.staff_department || extras.teacher_department,
      qualification: extras.staff_qualification || extras.teacher_qualification,
      joining_date: extras.staff_doj || extras.teacher_doj,
      employment_type: extras.staff_employment_type || extras.teacher_employment_type,
      teacher_role: extras.staff_role || extras.teacher_role,
      address: extras.staff_address_line || extras.teacher_address_line,
      city: extras.staff_city || extras.teacher_city,
      state: extras.staff_state || extras.teacher_state,
      country: extras.staff_country || extras.teacher_country,
      pincode: extras.staff_pincode || extras.teacher_pincode,
      emergency_contact_name: extras.staff_emergency_contact_name || extras.teacher_emergency_contact_name,
      emergency_contact_phone: extras.staff_emergency_contact_phone || extras.teacher_emergency_contact_phone,
      emergency_contact_relation: extras.staff_emergency_contact_relation || extras.teacher_emergency_contact_relation,
      blood_group: extras.staff_blood_group || extras.teacher_blood_group,
      medical_conditions: extras.staff_medical_conditions || extras.teacher_medical_conditions,
      subjects: extras.teacher_subjects || extras.staff_subjects || details.subjects || extras.subjects || [],
      sections: details.sections || auth.sections || [],
      permissions: details.permissions || extras.permissions,
      remarks: extras.staff_remarks || extras.teacher_remarks,
      campus_id: details.campus_id,
      campus: auth.campus,
      username: auth.username,
      role: auth.role,
    };
  }, [auth]);

  const formatDate = (dateString) => {
    if (!dateString) return t("common.notProvided");
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });
  };

  const formatBloodGroup = (bloodGroup) => {
    if (!bloodGroup) return t("common.notProvided");
    const map = {
      a_plus: "A+", a_minus: "A-", b_plus: "B+", b_minus: "B-",
      o_plus: "O+", o_minus: "O-", ab_plus: "AB+", ab_minus: "AB-",
    };
    return map[bloodGroup] || bloodGroup;
  };

  const initials = staffData?.full_name
    ? staffData.full_name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "T";

  const isActive = staffData?.current_status === "active";

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--color-background)] pb-20 md:pb-8">

      {/* Hero Banner */}
      <div className="relative h-36 md:h-48 bg-gradient-to-br from-primary-600 to-primary-800 overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }}
        />
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6">

        {/* Profile Header Card */}
        <div className="-mt-16 md:-mt-20 mb-6 relative z-10">
          <Card className="p-5 md:p-7 shadow-md">
            <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-end">

              {/* Avatar */}
              <div className="flex-shrink-0 -mt-2">
                {staffData?.photo_url && !imgError ? (
                  <img
                    src={staffData.photo_url}
                    alt={t("profile.photoAlt")}
                    onError={() => setImgError(true)}
                    className="h-24 w-24 md:h-28 md:w-28 rounded-2xl object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="h-24 w-24 md:h-28 md:w-28 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 text-white flex items-center justify-center text-3xl font-bold border-4 border-white shadow-lg select-none">
                    {initials}
                  </div>
                )}
              </div>

              {/* Name & Meta */}
              <div className="flex-1 text-center sm:text-left min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-wrap justify-center sm:justify-start">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">
                    {staffData?.full_name || t("profile.staffName")}
                  </h1>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-semibold ${isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-gray-400"}`} />
                    {staffData?.current_status?.charAt(0).toUpperCase() + staffData?.current_status?.slice(1) || t("common.na")}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 justify-center sm:justify-start text-sm text-gray-600">
                  {staffData?.designation && (
                    <span className="flex items-center gap-1.5">
                      <Briefcase size={14} className="text-primary-500" />
                      {staffData.designation}
                    </span>
                  )}
                  {staffData?.department && (
                    <span className="flex items-center gap-1.5">
                      <Building2 size={14} className="text-primary-500" />
                      {staffData.department}
                    </span>
                  )}
                  {staffData?.employee_code && (
                    <span className="flex items-center gap-1.5">
                      <BadgeCheck size={14} className="text-primary-500" />
                      #{staffData.employee_code}
                    </span>
                  )}
                </div>
              </div>

              {/* Change Password */}
              <div className="flex-shrink-0">
                <button
                  onClick={() => setChangePasswordOpen(true)}
                  className="flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:opacity-90 transition-all text-sm font-medium shadow-sm motion-reduce:active:scale-100 active:scale-[0.99]"
                >
                  <Key size={16} />
                  {t("profile.changePassword")}
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Main content: 2-col on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* Left sidebar */}
          <div className="space-y-6">

            {/* Quick contact */}
            <SectionCard icon={<Mail size={18} />} title={t("profile.contact")}>
              <ContactRow icon={<Mail size={15} />} value={staffData?.email} placeholder={t("profile.noEmail")} />
              <ContactRow icon={<Phone size={15} />} value={staffData?.phone} placeholder={t("profile.noPhone")} />
            </SectionCard>

            {/* Teaching snapshot */}
            <SectionCard icon={<BookOpen size={18} />} title={t("profile.teaching")}>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-gray-700 tracking-wide mb-2">{t("profile.subjects")}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {staffData?.subjects?.length > 0 ? (
                      staffData.subjects.map((s, i) => (
                        <span key={i} className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-sm font-medium">
                          {typeof s === "string" ? s : s.label || s.name || t("profile.subjectFallback")}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-600">{t("profile.noSubjectsAssigned")}</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 tracking-wide mb-2">{t("profile.classes")}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {staffData?.sections?.length > 0 ? (
                      staffData.sections.map((sec, i) => (
                        <span key={sec.value || i} className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-sm font-medium">
                          {sec.label || sec.name || sec.section_name || t("profile.sectionFallback")}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-600">{t("profile.noClassesAssigned")}</span>
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Emergency */}
            <SectionCard icon={<AlertCircle size={18} />} title={t("profile.emergency")}>
              <InfoRow label={t("profile.fields.name")} value={staffData?.emergency_contact_name} />
              <InfoRow label={t("profile.fields.phone")} value={staffData?.emergency_contact_phone} />
              <InfoRow label={t("profile.fields.relation")} value={staffData?.emergency_contact_relation} />
            </SectionCard>

            {/* Medical */}
            <SectionCard icon={<Heart size={18} />} title={t("profile.medical")}>
              <InfoRow label={t("profile.fields.bloodGroup")} value={formatBloodGroup(staffData?.blood_group)} />
              <InfoRow label={t("profile.fields.conditions")} value={staffData?.medical_conditions || t("common.none")} />
            </SectionCard>
          </div>

          {/* Right main area */}
          <div className="lg:col-span-2 space-y-6">

            {/* Personal Information */}
            <SectionCard icon={<User size={18} />} title={t("profile.personalInfo")}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                <InfoRow label={t("profile.fields.firstName")} value={staffData?.first_name} icon={<User size={14} />} />
                <InfoRow label={t("profile.fields.middleName")} value={staffData?.middle_name} icon={<User size={14} />} />
                <InfoRow label={t("profile.fields.lastName")} value={staffData?.last_name} icon={<User size={14} />} />
                <InfoRow label={t("profile.fields.gender")} value={staffData?.gender} icon={<User size={14} />} />
                <InfoRow label={t("profile.fields.dateOfBirth")} value={formatDate(staffData?.dob)} icon={<Calendar size={14} />} />
                <InfoRow label={t("profile.fields.bloodGroup")} value={formatBloodGroup(staffData?.blood_group)} icon={<Droplet size={14} />} />
              </div>
              <div className="mt-2 pt-4 border-t border-gray-100">
                <p className="text-sm font-semibold text-gray-700 tracking-wide mb-3">{t("profile.address")}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                  <InfoRow label={t("profile.fields.street")} value={staffData?.address} icon={<MapPin size={14} />} />
                  <InfoRow label={t("profile.fields.city")} value={staffData?.city} icon={<MapPin size={14} />} />
                  <InfoRow label={t("profile.fields.state")} value={staffData?.state} icon={<MapPin size={14} />} />
                  <InfoRow label={t("profile.fields.country")} value={staffData?.country} icon={<MapPin size={14} />} />
                  <InfoRow label={t("profile.fields.pincode")} value={staffData?.pincode} icon={<MapPin size={14} />} />
                </div>
              </div>
            </SectionCard>

            {/* Professional Information */}
            <SectionCard icon={<Briefcase size={18} />} title={t("profile.professionalInfo")}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                <InfoRow label={t("profile.fields.staffId")} value={staffData?.staff_id} icon={<Award size={14} />} />
                <InfoRow label={t("profile.fields.employeeCode")} value={staffData?.employee_code} icon={<BadgeCheck size={14} />} />
                <InfoRow label={t("profile.fields.designation")} value={staffData?.designation} icon={<Briefcase size={14} />} />
                <InfoRow label={t("profile.fields.department")} value={staffData?.department} icon={<Building2 size={14} />} />
                <InfoRow label={t("profile.fields.qualification")} value={staffData?.qualification} icon={<GraduationCap size={14} />} />
                <InfoRow label={t("profile.fields.joiningDate")} value={formatDate(staffData?.joining_date)} icon={<Calendar size={14} />} />
                <InfoRow label={t("profile.fields.employmentType")} value={staffData?.employment_type} icon={<Clock size={14} />} />
                <div className="py-3 border-b border-gray-100 last:border-b-0">
                  <p className="text-sm text-gray-600 mb-1">{t("profile.fields.status")}</p>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-sm font-semibold ${isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-gray-400"}`} />
                    {staffData?.current_status?.charAt(0).toUpperCase() + staffData?.current_status?.slice(1) || t("common.na")}
                  </span>
                </div>
              </div>
            </SectionCard>

            {/* Permissions */}
            {staffData?.permissions && (
              <SectionCard icon={<Shield size={18} />} title={t("profile.permissions")}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(staffData.permissions).map(([key, value]) => (
                    <div
                      key={key}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-colors ${value ? "bg-green-50 border-green-100" : "bg-gray-50 border-gray-100"}`}
                    >
                      <CheckCircle
                        size={16}
                        className={value ? "text-green-500" : "text-gray-300"}
                      />
                      <span className={`text-sm font-medium ${value ? "text-gray-800" : "text-gray-400"}`}>
                        {formatPermissionLabel(key)}
                      </span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>
        </div>
      </div>

      <ChangePasswordModal
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </div>
  );
}

// Section card wrapper
function SectionCard({ icon, title, children }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-primary-600">{icon}</span>
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
      </div>
      {children}
    </Card>
  );
}

// Label + value row with bottom divider
function InfoRow({ label, value, icon }) {
  const { t } = useTranslation();
  const display = value || t("common.notProvided");
  const isEmpty = !value;
  return (
    <div className="py-3 border-b border-gray-100 last:border-b-0">
      <p className="text-sm text-gray-600 mb-0.5 flex items-center gap-1">
        {icon && <span className="text-gray-300">{icon}</span>}
        {label}
      </p>
      <p className={`text-sm font-medium break-words ${isEmpty ? "text-gray-300 italic" : "text-gray-900"}`}>
        {display}
      </p>
    </div>
  );
}

// Compact contact row
function ContactRow({ icon, value, placeholder }) {
  return (
    <div className="flex items-center gap-2.5 py-2.5 border-b border-gray-100 last:border-b-0">
      <span className="text-gray-500 flex-shrink-0">{icon}</span>
      <span className={`text-sm break-all ${value ? "text-gray-800 font-medium" : "text-gray-300 italic"}`}>
        {value || placeholder}
      </span>
    </div>
  );
}

function formatPermissionLabel(key) {
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
