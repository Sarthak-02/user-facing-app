import { createElement, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card } from "../../ui-components";
import { useAuth } from "../../store/auth.store";
import {
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Megaphone,
  Moon,
  XCircle,
} from "lucide-react";

function addDaysISO(fromDate, dayDelta) {
  const d = new Date(fromDate);
  d.setDate(d.getDate() + dayDelta);
  return d.toISOString().slice(0, 10);
}

/** Static placeholder data — replace with API responses later. */
const DUMMY = {
  /** Used only on Mon–Fri when not a weekend. */
  presentToday: true,
  /**
   * Monday–Friday periods (24h "HH:MM").
   * Index 0 = Sunday … 6 = Saturday (empty weekend).
   */
  timetableByWeekday: {
    1: [
      { start: "08:00", end: "08:45", subject: "Assembly", room: "Hall" },
      { start: "08:50", end: "09:35", subject: "Mathematics", room: "Room 201" },
      { start: "09:40", end: "10:25", subject: "Science", room: "Lab 1" },
      { start: "10:25", end: "10:45", subject: "Break", room: "—" },
      { start: "10:45", end: "11:30", subject: "English", room: "Room 105" },
      { start: "11:35", end: "12:20", subject: "Social Studies", room: "Room 112" },
      { start: "12:20", end: "13:00", subject: "Lunch", room: "Cafeteria" },
      { start: "13:00", end: "13:45", subject: "Hindi", room: "Room 108" },
      { start: "13:50", end: "14:35", subject: "Computer Science", room: "Lab 2" },
    ],
    2: [
      { start: "08:00", end: "08:45", subject: "Assembly", room: "Hall" },
      { start: "08:50", end: "09:35", subject: "English", room: "Room 105" },
      { start: "09:40", end: "10:25", subject: "Mathematics", room: "Room 201" },
      { start: "10:25", end: "10:45", subject: "Break", room: "—" },
      { start: "10:45", end: "11:30", subject: "Science", room: "Lab 1" },
      { start: "11:35", end: "12:20", subject: "Hindi", room: "Room 108" },
      { start: "12:20", end: "13:00", subject: "Lunch", room: "Cafeteria" },
      { start: "13:00", end: "13:45", subject: "Physical Education", room: "Ground" },
      { start: "13:50", end: "14:35", subject: "Art", room: "Studio A" },
    ],
    3: [
      { start: "08:00", end: "08:45", subject: "Assembly", room: "Hall" },
      { start: "08:50", end: "09:35", subject: "Science", room: "Lab 1" },
      { start: "09:40", end: "10:25", subject: "Social Studies", room: "Room 112" },
      { start: "10:25", end: "10:45", subject: "Break", room: "—" },
      { start: "10:45", end: "11:30", subject: "Mathematics", room: "Room 201" },
      { start: "11:35", end: "12:20", subject: "English", room: "Room 105" },
      { start: "12:20", end: "13:00", subject: "Lunch", room: "Cafeteria" },
      { start: "13:00", end: "13:45", subject: "Computer Science", room: "Lab 2" },
      { start: "13:50", end: "14:35", subject: "Music", room: "Music room" },
    ],
    4: [
      { start: "08:00", end: "08:45", subject: "Assembly", room: "Hall" },
      { start: "08:50", end: "09:35", subject: "Hindi", room: "Room 108" },
      { start: "09:40", end: "10:25", subject: "English", room: "Room 105" },
      { start: "10:25", end: "10:45", subject: "Break", room: "—" },
      { start: "10:45", end: "11:30", subject: "Mathematics", room: "Room 201" },
      { start: "11:35", end: "12:20", subject: "Science", room: "Lab 1" },
      { start: "12:20", end: "13:00", subject: "Lunch", room: "Cafeteria" },
      { start: "13:00", end: "13:45", subject: "Social Studies", room: "Room 112" },
      { start: "13:50", end: "14:35", subject: "Library", room: "Library" },
    ],
    5: [
      { start: "08:00", end: "08:45", subject: "Assembly", room: "Hall" },
      { start: "08:50", end: "09:35", subject: "Mathematics", room: "Room 201" },
      { start: "09:40", end: "10:25", subject: "English", room: "Room 105" },
      { start: "10:25", end: "10:45", subject: "Break", room: "—" },
      { start: "10:45", end: "11:30", subject: "Science", room: "Lab 1" },
      { start: "11:35", end: "12:20", subject: "Hindi", room: "Room 108" },
      { start: "12:20", end: "13:00", subject: "Lunch", room: "Cafeteria" },
      { start: "13:00", end: "13:45", subject: "Value education", room: "Room 101" },
      { start: "13:50", end: "14:35", subject: "Club activity", room: "Various" },
    ],
    0: [],
    6: [],
  },
};

function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function nowMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function greetingForHour(hour) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDisplayDate(d) {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatShortDue(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function SectionTitle({ icon, title, wrapperClassName = "mb-4 flex items-center gap-3" }) {
  return (
    <div className={wrapperClassName}>
      <span
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-800 dark:bg-primary-950/50 dark:text-primary-900"
        aria-hidden
      >
        {createElement(icon, { size: 18, strokeWidth: 2 })}
      </span>
      <h2 className="text-lg font-semibold tracking-tight text-gray-950 dark:text-gray-900">
        {title}
      </h2>
    </div>
  );
}

export default function StudentHome() {
  const { auth } = useAuth();

  const firstName = useMemo(() => {
    const fromAuth = auth?.details?.student_first_name?.trim();
    if (fromAuth) return fromAuth;
    return "Sarthak";
  }, [auth?.details?.student_first_name]);

  const { summary, periods, currentPeriodIndex, upcomingHomework, announcements } =
    useMemo(() => {
      const now = new Date();
      const weekday = now.getDay();
      const isWeekend = weekday === 0 || weekday === 6;

      const greeting = `${greetingForHour(now.getHours())},`;
      const dayLine = formatDisplayDate(now);

      let attendanceLine;
      let attendanceVariant;
      if (isWeekend) {
        attendanceLine =
          weekday === 0
            ? "No school today — Sunday is a weekly off."
            : "No school today — Saturday is a weekly off.";
        attendanceVariant = "weekend";
      } else if (DUMMY.presentToday) {
        attendanceLine = "You are marked present today.";
        attendanceVariant = "present";
      } else {
        attendanceLine = "You are marked absent today.";
        attendanceVariant = "absent";
      }

      const periodsToday = DUMMY.timetableByWeekday[weekday] ?? [];
      const mins = nowMinutes();
      let idx = -1;
      for (let i = 0; i < periodsToday.length; i++) {
        const p = periodsToday[i];
        const a = timeToMinutes(p.start);
        const b = timeToMinutes(p.end);
        if (mins >= a && mins < b) {
          idx = i;
          break;
        }
      }

      const allHomework = [
        {
          id: "hw-1",
          title: "Algebra — Chapter 5 exercises",
          subject: "Mathematics",
          due_date: addDaysISO(now, 2),
        },
        {
          id: "hw-2",
          title: "Essay: Climate change (500 words)",
          subject: "English",
          due_date: addDaysISO(now, 9),
        },
        {
          id: "hw-3",
          title: "Diagram of plant cell",
          subject: "Science",
          due_date: addDaysISO(now, 0),
        },
        {
          id: "hw-4",
          title: "Past tense worksheet",
          subject: "Hindi",
          due_date: addDaysISO(now, -4),
        },
      ];

      const todayStart = startOfToday();
      const upcomingHomework = allHomework
        .filter((h) => {
          const due = new Date(h.due_date);
          due.setHours(0, 0, 0, 0);
          return due.getTime() > todayStart.getTime();
        })
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

      const announcements = [
        {
          id: "a1",
          title: "Annual sports day",
          body: "House practice sessions begin next week. Check the notice board for timings.",
          date: addDaysISO(now, -1),
        },
        {
          id: "a2",
          title: "Library hours",
          body: "The library will close at 2 PM this Friday for inventory.",
          date: addDaysISO(now, -2),
        },
        {
          id: "a3",
          title: "Parent–teacher meeting",
          body: "PTM for Grade 10 is scheduled on the first Saturday of next month.",
          date: addDaysISO(now, -5),
        },
      ];

      return {
        summary: { greeting, firstName, dayLine, attendanceLine, attendanceVariant },
        periods: periodsToday,
        currentPeriodIndex: idx,
        upcomingHomework,
        announcements,
      };
    }, [firstName]);

  const attendanceIcon =
    summary.attendanceVariant === "present" ? (
      <CheckCircle2 className="text-success-600 shrink-0" size={22} />
    ) : summary.attendanceVariant === "absent" ? (
      <XCircle className="text-error-600 shrink-0" size={22} />
    ) : summary.attendanceVariant === "weekend" ? (
      <Moon className="text-primary-600 shrink-0" size={22} />
    ) : null;

  return (
    <div className="min-h-full bg-white p-4 md:p-6 ">
      <div className="mx-auto max-w-5xl space-y-6">
        <Card className="border border-gray-100 bg-white shadow-sm dark:border-gray-800 ">
          <div className="flex flex-col gap-4 border-l-4 border-blue-500 pl-4 sm:flex-row sm:items-start sm:justify-between sm:pl-5">
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-800">
                {summary.greeting}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-950  md:text-3xl">
                {summary.firstName},
              </h1>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-800">
                <CalendarDays size={16} className="shrink-0 text-primary-700 dark:text-primary-400" />
                {summary.dayLine}
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50/80 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/60">
              {attendanceIcon}
              <p className="text-sm font-semibold leading-snug text-gray-950 dark:text-gray-50">
                {summary.attendanceLine}
              </p>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border border-gray-100 bg-white shadow-sm dark:border-gray-800 ">
            <SectionTitle icon={Clock} title="Today's schedule" />
            {periods.length === 0 ? (
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-800">
                No classes scheduled for today.
              </p>
            ) : (
              <ul className="space-y-2">
                {periods.map((p, i) => {
                  const isCurrent = i === currentPeriodIndex;
                  return (
                    <li
                      key={`${p.start}-${p.subject}`}
                      className={`flex flex-col gap-1 rounded-lg border px-3 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between ${
                        isCurrent
                          ? "border-blue-500 bg-sky-50 shadow-sm dark:border-blue-400 dark:bg-sky-950/40"
                          : "border-gray-100 bg-white dark:border-gray-700 "
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-950 dark:text-gray-800">
                          {p.subject}
                          {isCurrent ? (
                            <span className="ml-2 inline-flex items-center rounded-md bg-primary-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ">
                              Now
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-600">{p.room}</p>
                      </div>
                      <p className="shrink-0 font-mono text-xs font-bold tabular-nums text-gray-950 dark:text-gray-800">
                        {p.start} – {p.end}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card className="border border-gray-100 bg-white shadow-sm dark:border-gray-800 ">
            <div className="mb-4 flex items-center justify-between gap-3">
              <SectionTitle
                icon={BookOpen}
                title="Homework"
                wrapperClassName="mb-0 flex min-w-0 items-center gap-3"
              />
              <Link
                to="/student/homework"
                className="inline-flex shrink-0 items-center gap-0.5 text-xs font-bold text-primary-700 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
              >
                View all
                <ChevronRight size={14} />
              </Link>
            </div>
            {upcomingHomework.length === 0 ? (
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-800">
                No upcoming homework with a future due date.
              </p>
            ) : (
              <ul className="space-y-2">
                {upcomingHomework.map((h) => (
                  <li key={h.id}>
                    <Link
                      to="/student/homework"
                      className="block rounded-lg border border-gray-100 bg-white px-3 py-2.5 transition-all hover:border-primary-400 hover:bg-primary-50/60 dark:border-gray-700 dark:hover:border-primary-500 dark:hover:bg-primary-950/30"
                    >
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-950 dark:text-gray-800">
                        {h.subject}
                      </p>
                      <p className="mt-0.5 font-semibold text-gray-950 dark:text-gray-800">{h.title}</p>
                      <p className="mt-1 text-xs font-semibold text-gray-800 dark:text-gray-600">
                        Due {formatShortDue(h.due_date)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card className="border border-gray-100 bg-white shadow-sm dark:border-gray-800 ">
          <SectionTitle icon={Megaphone} title="Announcements" />
          <ul className="space-y-4">
            {announcements.map((a) => (
              <li
                key={a.id}
                className="flex gap-3 border-b border-gray-100 pb-4 last:border-0 last:pb-0 dark:border-gray-700"
              >
                <span
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-800 dark:bg-primary-950/50 dark:text-primary-900"
                  aria-hidden
                >
                  <Bell size={16} />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-950 dark:text-gray-800">{a.title}</p>
                  <p className="mt-1 text-sm font-semibold leading-relaxed text-gray-900 dark:text-gray-800">
                    {a.body}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-gray-800 dark:text-gray-600">
                    {formatShortDue(a.date)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <p className="text-center text-xs font-semibold text-gray-800 dark:text-gray-600">
          Sample data for layout preview — connect APIs when ready.
        </p>
      </div>
    </div>
  );
}
