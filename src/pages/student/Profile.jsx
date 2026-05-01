import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../ui-components";
import { useAuth } from "../../store/auth.store";
import {
  User, Mail, Phone, GraduationCap, Calendar,
  MapPin, Users, BookOpen, Award,
  Heart, AlertCircle, Droplet, Key, BadgeCheck
} from "lucide-react";
import ChangePasswordModal from "../../components/ChangePasswordModal";

export default function StudentProfile() {
  const { t } = useTranslation();
  const { auth } = useAuth();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const studentData = useMemo(() => {
    const details = auth.details || {};
    const extras = details.extras || {};

    return {
      student_id: details.student_id,
      admission_no: details.student_admission_no,
      roll_no: details.student_roll_no,
      photo_url: details.student_photo_url,
      first_name: details.student_first_name,
      middle_name: details.student_middle_name,
      last_name: details.student_last_name,
      full_name: `${details.student_first_name || ""} ${details.student_middle_name || ""} ${details.student_last_name || ""}`.trim(),
      gender: details.student_gender,
      dob: details.student_dob,
      current_status: details.student_current_status,
      email: extras.student_email,
      phone: extras.student_phone,
      section: details.sections?.[0]?.label || null,
      section_id: details.student_section_id,
      admission_date: extras.student_admission_date,
      category: extras.student_category,
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
      emergency_contact_name: extras.student_emergency_contact_name,
      emergency_contact_phone: extras.student_emergency_contact_phone,
      blood_group: extras.student_blood_group,
      medical_conditions: extras.student_medical_conditions,
      remarks: extras.student_remarks,
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

  const initials = studentData?.full_name
    ? studentData.full_name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "S";

  const isActive = studentData?.current_status === "active";

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--color-background)] pb-20 md:pb-8">

      {/* Hero Banner */}
      <div className="relative h-36 md:h-48 bg-gradient-to-br from-primary-600 to-primary-700 overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
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
                {studentData?.photo_url && !imgError ? (
                  <img
                    src={studentData.photo_url}
                    alt={t("profile.studentName")}
                    onError={() => setImgError(true)}
                    className="h-24 w-24 md:h-28 md:w-28 rounded-2xl object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="h-24 w-24 md:h-28 md:w-28 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 text-white flex items-center justify-center text-3xl font-bold border-4 border-white shadow-lg select-none">
                    {initials}
                  </div>
                )}
              </div>

              {/* Name & Meta */}
              <div className="flex-1 text-center sm:text-left min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-wrap justify-center sm:justify-start">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">
                    {studentData?.full_name || t("profile.studentName")}
                  </h1>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-gray-400"}`} />
                    {studentData?.current_status?.charAt(0).toUpperCase() + studentData?.current_status?.slice(1) || "N/A"}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 justify-center sm:justify-start text-sm text-gray-500">
                  {studentData?.admission_no && (
                    <span className="flex items-center gap-1.5">
                      <BadgeCheck size={14} className="text-primary-500" />
                      {t("profile.admissionHash", { number: studentData.admission_no })}
                    </span>
                  )}
                  {studentData?.roll_no && (
                    <span className="flex items-center gap-1.5">
                      <Award size={14} className="text-primary-500" />
                      {t("profile.rollHash", { number: studentData.roll_no })}
                    </span>
                  )}
                  {studentData?.section && (
                    <span className="flex items-center gap-1.5">
                      <GraduationCap size={14} className="text-primary-500" />
                      {studentData.section}
                    </span>
                  )}
                </div>
              </div>

              {/* Change Password */}
              <div className="flex-shrink-0">
                <button
                  onClick={() => setChangePasswordOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:opacity-90 active:scale-95 transition-all text-sm font-medium shadow-sm"
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
              <ContactRow icon={<Mail size={15} />} value={studentData?.email} placeholder={t("profile.noEmail")} />
              <ContactRow icon={<Phone size={15} />} value={studentData?.phone} placeholder={t("profile.noPhone")} />
            </SectionCard>

            {/* Academic snapshot */}
            <SectionCard icon={<BookOpen size={18} />} title={t("profile.academic")}>
              <InfoRow label={t("profile.fields.classSection")} value={studentData?.section} icon={<GraduationCap size={14} />} />
              <InfoRow label={t("profile.fields.admissionNo")} value={studentData?.admission_no} icon={<BadgeCheck size={14} />} />
              <InfoRow label={t("profile.fields.rollNo")} value={studentData?.roll_no} icon={<Award size={14} />} />
              <InfoRow label={t("profile.fields.admissionDate")} value={formatDate(studentData?.admission_date)} icon={<Calendar size={14} />} />
              <div className="py-3 border-b border-gray-100 last:border-b-0">
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                  <span className="text-gray-300"><User size={14} /></span>
                  {t("profile.fields.status")}
                </p>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-gray-400"}`} />
                  {studentData?.current_status?.charAt(0).toUpperCase() + studentData?.current_status?.slice(1) || "N/A"}
                </span>
              </div>
            </SectionCard>

            {/* Emergency */}
            <SectionCard icon={<AlertCircle size={18} />} title={t("profile.emergency")}>
              <InfoRow label={t("profile.fields.name")} value={studentData?.emergency_contact_name} />
              <InfoRow label={t("profile.fields.phone")} value={studentData?.emergency_contact_phone} />
            </SectionCard>

            {/* Medical */}
            <SectionCard icon={<Heart size={18} />} title={t("profile.medical")}>
              <InfoRow label={t("profile.fields.bloodGroup")} value={formatBloodGroup(studentData?.blood_group)} />
              <InfoRow label={t("profile.fields.conditions")} value={studentData?.medical_conditions || t("common.none")} />
            </SectionCard>
          </div>

          {/* Right main area */}
          <div className="lg:col-span-2 space-y-6">

            {/* Personal Information */}
            <SectionCard icon={<User size={18} />} title={t("profile.personalInfo")}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                <InfoRow label={t("profile.fields.firstName")} value={studentData?.first_name} icon={<User size={14} />} />
                <InfoRow label={t("profile.fields.middleName")} value={studentData?.middle_name} icon={<User size={14} />} />
                <InfoRow label={t("profile.fields.lastName")} value={studentData?.last_name} icon={<User size={14} />} />
                <InfoRow label={t("profile.fields.gender")} value={studentData?.gender} icon={<User size={14} />} />
                <InfoRow label={t("profile.fields.dateOfBirth")} value={formatDate(studentData?.dob)} icon={<Calendar size={14} />} />
                <InfoRow label={t("profile.fields.bloodGroup")} value={formatBloodGroup(studentData?.blood_group)} icon={<Droplet size={14} />} />
                <InfoRow label={t("profile.fields.category")} value={studentData?.category?.toUpperCase()} icon={<User size={14} />} />
              </div>
            </SectionCard>

            {/* Academic Information */}
            <SectionCard icon={<BookOpen size={18} />} title={t("profile.academicInfo")}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                <InfoRow label={t("profile.fields.studentId")} value={studentData?.student_id} icon={<Award size={14} />} />
                <InfoRow label={t("profile.fields.admissionNumber")} value={studentData?.admission_no} icon={<BadgeCheck size={14} />} />
                <InfoRow label={t("profile.fields.rollNumber")} value={studentData?.roll_no} icon={<Award size={14} />} />
                <InfoRow label={t("profile.fields.classSection")} value={studentData?.section} icon={<GraduationCap size={14} />} />
                <InfoRow label={t("profile.fields.admissionDate")} value={formatDate(studentData?.admission_date)} icon={<Calendar size={14} />} />
              </div>
            </SectionCard>

            {/* Parent / Guardian Information */}
            <SectionCard icon={<Users size={18} />} title={t("profile.parentGuardianInfo")}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                <InfoRow label={t("profile.fields.fathersName")} value={studentData?.father_name} icon={<User size={14} />} />
                <InfoRow label={t("profile.fields.mothersName")} value={studentData?.mother_name} icon={<User size={14} />} />
                <InfoRow label={t("profile.fields.guardianName")} value={studentData?.guardian_name} icon={<User size={14} />} />
                <InfoRow label={t("profile.fields.relationship")} value={studentData?.guardian_relation} icon={<User size={14} />} />
                <InfoRow label={t("profile.fields.primaryContact")} value={studentData?.primary_contact?.toUpperCase()} icon={<User size={14} />} />
                <InfoRow label={t("profile.fields.guardianPhone")} value={studentData?.guardian_phone} icon={<Phone size={14} />} />
                <InfoRow label={t("profile.fields.guardianEmail")} value={studentData?.guardian_email} icon={<Mail size={14} />} />
              </div>
              <div className="mt-2 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">{t("profile.guardianAddress")}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                  <InfoRow label={t("profile.fields.street")} value={studentData?.guardian_address} icon={<MapPin size={14} />} />
                  <InfoRow label={t("profile.fields.city")} value={studentData?.guardian_city} icon={<MapPin size={14} />} />
                  <InfoRow label={t("profile.fields.state")} value={studentData?.guardian_state} icon={<MapPin size={14} />} />
                  <InfoRow label={t("profile.fields.country")} value={studentData?.guardian_country} icon={<MapPin size={14} />} />
                  <InfoRow label={t("profile.fields.pincode")} value={studentData?.guardian_pincode} icon={<MapPin size={14} />} />
                </div>
              </div>
            </SectionCard>
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

function InfoRow({ label, value, icon }) {
  const { t } = useTranslation();
  const display = value || t("common.notProvided");
  const isEmpty = !value;
  return (
    <div className="py-3 border-b border-gray-100 last:border-b-0">
      <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1">
        {icon && <span className="text-gray-300">{icon}</span>}
        {label}
      </p>
      <p className={`text-sm font-medium break-words ${isEmpty ? "text-gray-300 italic" : "text-gray-900"}`}>
        {display}
      </p>
    </div>
  );
}

function ContactRow({ icon, value, placeholder }) {
  return (
    <div className="flex items-center gap-2.5 py-2.5 border-b border-gray-100 last:border-b-0">
      <span className="text-gray-400 flex-shrink-0">{icon}</span>
      <span className={`text-sm break-all ${value ? "text-gray-800 font-medium" : "text-gray-300 italic"}`}>
        {value || placeholder}
      </span>
    </div>
  );
}
