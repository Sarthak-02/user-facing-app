import { useMemo, useRef, useState } from "react";
import BroadcastForm from "../../components/broadcast/BroadcastForm";
import TargetSelector from "../../components/broadcast/TargetSelector";
import DesktopView from "../../components/broadcast/DesktopView";
import MobileView from "../../components/broadcast/MobileView";

const TARGET_OPTIONS = [
    { value: "CLASS", label: "Class" },
    { value: "SECTION", label: "Section" },
    { value: "STUDENT", label: "Student" },
  ]

export default function BroadcastPage({
  classes = [
    { id: "c1", name: "Class 1" },
    { id: "c2", name: "Class 2" },
  ],
  sectionsByClassId = {
    c1: [
      { id: "s1", name: "A" },
      { id: "s2", name: "B" },
    ],
    c2: [{ id: "s3", name: "A" }],
  },
  studentsBySectionId = {
    s1: [{ id: "st1", name: "Aarav Sharma" }],
    s2: [{ id: "st2", name: "Diya Singh" }],
    s3: [{ id: "st3", name: "Kabir Verma" }],
  },
}) {
  /* ---------------- state ---------------- */
  const [targetType, setTargetType] = useState("SECTION");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [studentId, setStudentId] = useState("");

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const [showTargetModal, setShowTargetModal] = useState(false);

  /* ---------------- derived ---------------- */
  const sections = useMemo(() => sectionsByClassId[classId] || [], [classId]);

  const students = useMemo(
    () => studentsBySectionId[sectionId] || [],
    [sectionId]
  );

  /* ---------------- helpers ---------------- */
  function resetCascade(type) {
    setTargetType(type);
    setClassId("");
    setSectionId("");
    setStudentId("");
  }

  const canSubmit = title.trim() && message.trim();

  const props = {
    title,
    setTitle,
    targetType,
    setTargetType,
    studentId,
    setStudentId,
    classId,
    setClassId,
    sectionId,
    setSectionId,
    sections,
    students,
    message,
    setMessage,
    canSubmit,
    resetCascade,
    classes,
    sectionsByClassId,
    studentsBySectionId,
    TARGET_OPTIONS,
  };

  const propsMobile = { ...props, showTargetModal, setShowTargetModal };
  /* ---------------- render ---------------- */
  return (
    <>
      <div className="h-full hidden md:block  p-4  ">
        <DesktopView {...props} />
      </div>
      <div className="h-screen block md:hidden p-4 flex flex-col ">
        <MobileView {...propsMobile} />
      </div>
    </>
  );
}
