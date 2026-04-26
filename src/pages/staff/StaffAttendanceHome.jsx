import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../ui-components";
import { ChevronRight } from "lucide-react";
import Loader from "../../ui-components/Loader";
import { useTeacherSectionRows } from "../../hooks/useTeacherSectionRows";

export default function StaffAttendanceHome() {
  const navigate = useNavigate();
  const rows = useTeacherSectionRows();

  useEffect(() => {
    if (rows.length === 1) {
      navigate(`/staff/attendance/section/${rows[0].sectionId}`, { replace: true });
    }
  }, [rows, navigate]);

  if (rows.length === 1) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6">
        <h1 className="text-xl font-bold text-gray-900">Attendance</h1>
        <p className="mt-3 text-sm text-gray-600">
          No class or section assignments were found. If you just logged in, try refreshing after
          permissions load.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6">
      <h1 className="text-xl font-bold text-gray-900">Attendance</h1>
      <p className="mt-1 text-sm text-gray-600">Choose a class and section to mark or view attendance.</p>
      <div className="mt-6 space-y-2">
        {rows.map((r) => (
          <Card
            key={r.sectionId}
            className="cursor-pointer transition hover:border-primary-300"
            onClick={() => navigate(`/staff/attendance/section/${r.sectionId}`)}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-gray-900">{r.label}</span>
              <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
