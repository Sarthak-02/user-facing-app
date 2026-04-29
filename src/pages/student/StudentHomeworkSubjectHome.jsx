import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../store/auth.store";
import { fetchStudentProfile } from "../../api/auth.api";
import { getStudentHomeworkAll } from "../../api/homework.api";
import {
  Calculator,
  FlaskConical,
  BookOpen,
  Globe,
  Landmark,
  Code2,
  Palette,
  Music,
  Dumbbell,
  Languages,
  TrendingUp,
  Briefcase,
  Brain,
  Atom,
  Leaf,
  Microscope,
  BookMarked,
} from "lucide-react";
import Loader from "../../ui-components/Loader";

function normalizeSubjectEntry(s) {
  if (!s) return null;
  if (typeof s === "string") return { subject_id: s, subject_name: s };
  const id = s.subject_id || s.id;
  if (!id) return null;
  return { subject_id: id, subject_name: s.subject_name || s.name || s.label || id };
}

const FALLBACK_CONFIGS = [
  { Icon: BookMarked, iconBg: "bg-blue-100", iconColor: "text-blue-600", headerBg: "bg-blue-50", border: "border-blue-200" },
  { Icon: BookMarked, iconBg: "bg-violet-100", iconColor: "text-violet-600", headerBg: "bg-violet-50", border: "border-violet-200" },
  { Icon: BookMarked, iconBg: "bg-emerald-100", iconColor: "text-emerald-600", headerBg: "bg-emerald-50", border: "border-emerald-200" },
  { Icon: BookMarked, iconBg: "bg-amber-100", iconColor: "text-amber-600", headerBg: "bg-amber-50", border: "border-amber-200" },
  { Icon: BookMarked, iconBg: "bg-rose-100", iconColor: "text-rose-600", headerBg: "bg-rose-50", border: "border-rose-200" },
  { Icon: BookMarked, iconBg: "bg-cyan-100", iconColor: "text-cyan-600", headerBg: "bg-cyan-50", border: "border-cyan-200" },
];

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function getSubjectConfig(name) {
  const n = (name || "").toLowerCase();

  if (/math|maths|arithmetic|algebra|geometry|calculus|statistics/.test(n))
    return { Icon: Calculator, iconBg: "bg-blue-100", iconColor: "text-blue-600", headerBg: "bg-blue-50", border: "border-blue-200" };
  if (/physics/.test(n))
    return { Icon: Atom, iconBg: "bg-sky-100", iconColor: "text-sky-600", headerBg: "bg-sky-50", border: "border-sky-200" };
  if (/chemistry|chemical/.test(n))
    return { Icon: FlaskConical, iconBg: "bg-purple-100", iconColor: "text-purple-600", headerBg: "bg-purple-50", border: "border-purple-200" };
  if (/biology|bio/.test(n))
    return { Icon: Microscope, iconBg: "bg-emerald-100", iconColor: "text-emerald-600", headerBg: "bg-emerald-50", border: "border-emerald-200" };
  if (/science|evs/.test(n))
    return { Icon: FlaskConical, iconBg: "bg-teal-100", iconColor: "text-teal-600", headerBg: "bg-teal-50", border: "border-teal-200" };
  if (/english|literature|reading|writing/.test(n))
    return { Icon: BookOpen, iconBg: "bg-violet-100", iconColor: "text-violet-600", headerBg: "bg-violet-50", border: "border-violet-200" };
  if (/hindi|urdu|tamil|telugu|kannada|malayalam|bengali|marathi|sanskrit|language/.test(n))
    return { Icon: Languages, iconBg: "bg-orange-100", iconColor: "text-orange-600", headerBg: "bg-orange-50", border: "border-orange-200" };
  if (/history|social|civics|political/.test(n))
    return { Icon: Landmark, iconBg: "bg-amber-100", iconColor: "text-amber-600", headerBg: "bg-amber-50", border: "border-amber-200" };
  if (/geography|geo/.test(n))
    return { Icon: Globe, iconBg: "bg-cyan-100", iconColor: "text-cyan-600", headerBg: "bg-cyan-50", border: "border-cyan-200" };
  if (/computer|ict|coding|programming|technology/.test(n))
    return { Icon: Code2, iconBg: "bg-indigo-100", iconColor: "text-indigo-600", headerBg: "bg-indigo-50", border: "border-indigo-200" };
  if (/art|craft|drawing|paint/.test(n))
    return { Icon: Palette, iconBg: "bg-rose-100", iconColor: "text-rose-600", headerBg: "bg-rose-50", border: "border-rose-200" };
  if (/music|singing/.test(n))
    return { Icon: Music, iconBg: "bg-pink-100", iconColor: "text-pink-600", headerBg: "bg-pink-50", border: "border-pink-200" };
  if (/pe |physical education|sport|gym/.test(n))
    return { Icon: Dumbbell, iconBg: "bg-lime-100", iconColor: "text-lime-600", headerBg: "bg-lime-50", border: "border-lime-200" };
  if (/economics|commerce|accounting|finance/.test(n))
    return { Icon: TrendingUp, iconBg: "bg-green-100", iconColor: "text-green-600", headerBg: "bg-green-50", border: "border-green-200" };
  if (/business|management/.test(n))
    return { Icon: Briefcase, iconBg: "bg-slate-100", iconColor: "text-slate-600", headerBg: "bg-slate-50", border: "border-slate-200" };
  if (/psychology|psych/.test(n))
    return { Icon: Brain, iconBg: "bg-fuchsia-100", iconColor: "text-fuchsia-600", headerBg: "bg-fuchsia-50", border: "border-fuchsia-200" };
  if (/environment/.test(n))
    return { Icon: Leaf, iconBg: "bg-green-100", iconColor: "text-green-600", headerBg: "bg-green-50", border: "border-green-200" };

  return FALLBACK_CONFIGS[hashStr(name) % FALLBACK_CONFIGS.length];
}

export default function StudentHomeworkSubjectHome() {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      const map = new Map();

      try {
        try {
          const rawProfile = await fetchStudentProfile(auth.userId);
          const data = rawProfile?.data ?? rawProfile;
          const fromProfile =
            data?.subjects || data?.details?.subjects || data?.extras?.subjects;
          if (Array.isArray(fromProfile)) {
            for (const s of fromProfile) {
              const n = normalizeSubjectEntry(s);
              if (n) map.set(n.subject_id, n);
            }
          }
        } catch (e) {
          console.warn("Student profile subjects unavailable", e);
        }

        try {
          const response = await getStudentHomeworkAll({
            student_id: auth.userId,
            status: "PUBLISHED",
            limit: 100,
            offset: 0,
          });
          const list = response?.data || response || [];
          if (Array.isArray(list)) {
            for (const hw of list) {
              const subj = hw.subject;
              if (subj && typeof subj === "string") {
                map.set(subj, { subject_id: subj, subject_name: subj });
              }
            }
          }
        } catch (e) {
          console.warn("Student homework list for subjects failed", e);
        }

        if (cancelled) return;

        const list = [...map.values()].sort((a, b) =>
          a.subject_name.localeCompare(b.subject_name)
        );
        setSubjects(list);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (auth.userId) {
      run();
    } else {
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [auth.userId]);

  useEffect(() => {
    if (!loading && subjects.length === 1) {
      const enc = encodeURIComponent(subjects[0].subject_id);
      navigate(`/student/homework/subject/${enc}`, { replace: true });
    }
  }, [loading, subjects, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (subjects.length === 1) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6">
        <h1 className="text-xl font-bold text-gray-900">Homework</h1>
        <p className="mt-3 text-sm text-gray-600">
          No subjects were found. Subjects appear here when they are on your profile or when
          teachers assign homework.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6">
      <h1 className="text-xl font-bold text-gray-900">Homework</h1>
      <p className="mt-1 text-sm text-gray-500">Choose a subject to view your assignments.</p>
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {subjects.map((s) => {
          const { Icon, iconBg, iconColor, headerBg, border } = getSubjectConfig(s.subject_name);
          return (
            <button
              key={s.subject_id}
              type="button"
              onClick={() =>
                navigate(`/student/homework/subject/${encodeURIComponent(s.subject_id)}`)
              }
              className={`group flex flex-col items-center rounded-2xl border ${border} bg-white overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 active:scale-95 transition-all duration-200`}
            >
              <div className={`w-full ${headerBg} flex items-center justify-center py-6`}>
                <div
                  className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200`}
                >
                  <Icon className={`h-7 w-7 ${iconColor}`} strokeWidth={1.7} />
                </div>
              </div>
              <div className="px-3 py-3 w-full">
                <p className="text-sm font-semibold text-gray-800 text-center leading-tight line-clamp-2">
                  {s.subject_name}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
