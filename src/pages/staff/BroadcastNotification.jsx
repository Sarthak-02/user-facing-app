import { useMemo, useRef, useState } from "react";
import BroadcastForm from "../../components/broadcast/BroadcastForm";
import TargetSelector from "../../components/TargetSelector";
import DesktopView from "../../components/broadcast/DesktopView";
import MobileView from "../../components/broadcast/MobileView";
import { SECTION_TARGET_SCHEMA, STUDENT_TARGET_SCHEMA, CLASS_TARGET_SCHEMA } from "../../utils/target.schema";
import { updateSchema } from "../../utils/update.schema";

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
  const [targetType, setTargetType] = useState({ value: "SCHOOL", label: "Entire School" });
  const [classId, setClassId] = useState(null);
  const [sectionId, setSectionId] = useState(null);
  const [studentId, setStudentId] = useState([]);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const [showTargetModal, setShowTargetModal] = useState(false);

  const TARGET_OPTIONS = [
    { value: "SCHOOL", label: "Entire School" },
    { value: "CLASS", label: "Class" },
    { value: "SECTION", label: "Section" },
    { value: "STUDENT", label: "Student" },
  ];

  /* ---------------- derived ---------------- */
  const sections = useMemo(() => sectionsByClassId[classId?.value] || [], [classId, sectionsByClassId]);

  const students = useMemo(
    () => studentsBySectionId[sectionId?.value] || [],
    [sectionId, studentsBySectionId]
  );

  const targetSchema = useMemo(() => {
    let data = {
      "class": {
        selected: classId,
        options: classes.map(({ id, name }) => ({
          value: id,
          label: name
        })),
        onChange: (option) => {
          setClassId(option);
          setSectionId(null);
          setStudentId([]);
        },
      },
      "section": {
        selected: sectionId,
        options: sections.map(({ id, name }) => ({
          value: id,
          label: name
        })),
        onChange: (option) => {
          setSectionId(option);
          setStudentId([]);
        },
      }
    }
    if (targetType?.value === "CLASS") {
      return updateSchema(CLASS_TARGET_SCHEMA, data);
    } else if (targetType?.value === "SECTION") {
      return updateSchema(SECTION_TARGET_SCHEMA, data);
    } else if (targetType?.value === "STUDENT") {
      data['student'] = {
        selected: studentId,
        options: students.map(({ id, name }) => ({
          value: id,
          label: name,
        })),
        onChange: (options) => {
          setStudentId(options);
        },
      };
      return updateSchema(STUDENT_TARGET_SCHEMA, data);
    }
    return [];
  }, [targetType, sectionId, classId, studentId, sections, students, classes]);

  /* ---------------- helpers ---------------- */
  const canSubmit = title.trim() && message.trim();

  const props = {
    title,
    setTitle,
    targetType,
    setTargetType,
    message,
    setMessage,
    canSubmit,
    TARGET_OPTIONS,
    schema: targetSchema,
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
