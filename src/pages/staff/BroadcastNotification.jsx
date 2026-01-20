import { useMemo, useRef, useState } from "react";
import BroadcastForm from "../../components/broadcast/BroadcastForm";
import TargetSelector from "../../components/TargetSelector";
import DesktopView from "../../components/broadcast/DesktopView";
import MobileView from "../../components/broadcast/MobileView";

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
  const [targetType, setTargetType] = useState("SCHOOL");
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
    classes,
    sectionsByClassId,
    studentsBySectionId,
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
