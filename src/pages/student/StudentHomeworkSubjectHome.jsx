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
  ChevronRight,
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
  { Icon: BookMarked, iconBg: "bg-blue-100", iconColor: "text-blue-600", border: "border-l-blue-400" },
  { Icon: BookMarked, iconBg: "bg-violet-100", iconColor: "text-violet-600", border: "border-l-violet-400" },
  { Icon: BookMarked, iconBg: "bg-emerald-100", iconColor: "text-emerald-600", border: "border-l-emerald-400" },
  { Icon: BookMarked, iconBg: "bg-amber-100", iconColor: "text-amber-600", border: "border-l-amber-400" },
  { Icon: BookMarked, iconBg: "bg-rose-100", iconColor: "text-rose-600", border: "border-l-rose-400" },
  { Icon: BookMarked, iconBg: "bg-cyan-100", iconColor: "text-cyan-600", border: "border-l-cyan-400" },
];

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function getSubjectConfig(name) {
  const n = (name || "").toLowerCase();

  if (/math|maths|arithmetic|algebra|geometry|calculus|statistics/.test(n))
    return { Icon: Calculator, iconBg: "bg-blue-100", iconColor: "text-blue-600", border: "border-l-blue-400" };
  if (/physics/.test(n))
    return { Icon: Atom, iconBg: "bg-sky-100", iconColor: "text-sky-600", border: "border-l-sky-400" };
  if (/chemistry|chemical/.test(n))
    return { Icon: FlaskConical, iconBg: "bg-purple-100", iconColor: "text-purple-600", border: "border-l-purple-400" };
  if (/biology|bio/.test(n))
    return { Icon: Microscope, iconBg: "bg-emerald-100", iconColor: "text-emerald-600", border: "border-l-emerald-400" };
  if (/science|evs/.test(n))
    return { Icon: FlaskConical, iconBg: "bg-teal-100", iconColor: "text-teal-600", border: "border-l-teal-400" };
  if (/english|literature|reading|writing/.test(n))
    return { Icon: BookOpen, iconBg: "bg-violet-100", iconColor: "text-violet-600", border: "border-l-violet-400" };
  if (/hindi|urdu|tamil|telugu|kannada|malayalam|bengali|marathi|sanskrit|language/.test(n))
    return { Icon: Languages, iconBg: "bg-orange-100", iconColor: "text-orange-600", border: "border-l-orange-400" };
  if (/history|social|civics|political/.test(n))
    return { Icon: Landmark, iconBg: "bg-amber-100", iconColor: "text-amber-600", border: "border-l-amber-400" };
  if (/geography|geo/.test(n))
    return { Icon: Globe, iconBg: "bg-cyan-100", iconColor: "text-cyan-600", border: "border-l-cyan-400" };
  if (/computer|ict|coding|programming|technology/.test(n))
    return { Icon: Code2, iconBg: "bg-indigo-100", iconColor: "text-indigo-600", border: "border-l-indigo-400" };
  if (/art|craft|drawing|paint/.test(n))
    return { Icon: Palette, iconBg: "bg-rose-100", iconColor: "text-rose-600", border: "border-l-rose-400" };
  if (/music|singing/.test(n))
    return { Icon: Music, iconBg: "bg-pink-100", iconColor: "text-pink-600", border: "border-l-pink-400" };
  if (/pe |physical education|sport|gym/.test(n))
    return { Icon: Dumbbell, iconBg: "bg-lime-100", iconColor: "text-lime-600", border: "border-l-lime-400" };
  if (/economics|commerce|accounting|finance/.test(n))
    return { Icon: TrendingUp, iconBg: "bg-green-100", iconColor: "text-green-600", border: "border-l-green-400" };
  if (/business|management/.test(n))
    return { Icon: Briefcase, iconBg: "bg-slate-100", iconColor: "text-slate-600", border: "border-l-slate-400" };
  if (/psychology|psych/.test(n))
    return { Icon: Brain, iconBg: "bg-fuchsia-100", iconColor: "text-fuchsia-600", border: "border-l-fuchsia-400" };
  if (/environment/.test(n))
    return { Icon: Leaf, iconBg: "bg-green-100", iconColor: "text-green-600", border: "border-l-green-400" };

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
      <div className="mt-5 space-y-2">
        {subjects.map((s) => {
          const { Icon, iconBg, iconColor, border } = getSubjectConfig(s.subject_name);
          return (
            <button
              key={s.subject_id}
              type="button"
              onClick={() =>
                navigate(`/student/homework/subject/${encodeURIComponent(s.subject_id)}`)
              }
              className={`w-full flex items-center gap-4 bg-white rounded-xl border border-gray-200 border-l-4 ${border} px-4 py-3.5 hover:shadow-sm hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-150`}
            >
              <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`h-5 w-5 ${iconColor}`} strokeWidth={1.8} />
              </div>
              <span className="flex-1 font-semibold text-gray-900 text-left">{s.subject_name}</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
