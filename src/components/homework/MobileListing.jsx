import { Badge, Card } from "../../ui-components";
import { useNavigate } from "react-router-dom";

function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function dueValue(hw) {
  return hw.dueDate || hw.due_date;
}

function classSectionLine(hw) {
  const cn = hw.className || hw.class_name;
  const sn = hw.section || hw.section_name;
  if (cn && sn) return `${cn} - ${sn}`;
  if (cn) return cn;
  if (sn) return sn;
  return null;
}

function StatusBadge({ status, dueDate }) {
  const now = new Date();
  const due = new Date(dueDate);

  if (status === "SUBMITTED") {
    return <Badge variant="success">Submitted</Badge>;
  }
  if (due < now && status !== "SUBMITTED") {
    return <Badge variant="error">Overdue</Badge>;
  }
  if (status === "ASSIGNED" || status === "PUBLISHED" || status === "ACTIVE") {
    return <Badge variant="info">{status === "ASSIGNED" ? "Assigned" : "Active"}</Badge>;
  }
  return <Badge variant="default">{status || "—"}</Badge>;
}

function AttachmentIndicator({ count }) {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-1 text-gray-600">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
        />
      </svg>
      <span className="text-sm">{count}</span>
    </div>
  );
}

export default function MobileListing({ homeworkList, listFromPath }) {
  const navigate = useNavigate();

  const handleCardClick = (homeworkId) => {
    navigate(`/student/homework/${homeworkId}`, {
      state: listFromPath ? { from: listFromPath } : undefined,
    });
  };

  return (
    <div className="h-full space-y-3 overflow-y-auto pb-20 md:hidden">
      {homeworkList.length === 0 ? (
        <Card>
          <div className="py-8 text-center text-gray-500">No homework assignments found.</div>
        </Card>
      ) : (
        homeworkList.map((homework) => {
          const due = dueValue(homework);
          const metaLine = classSectionLine(homework);
          const attachCount = homework.attachmentCount || homework.attachments?.length || 0;
          return (
            <Card
              key={homework.id}
              className="cursor-pointer transition-shadow active:bg-gray-50"
              onClick={() => handleCardClick(homework.id)}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="mb-1 line-clamp-2 text-base font-semibold text-gray-900">
                    {homework.title}
                  </h3>
                  <p className="text-sm text-gray-600">{homework.subject}</p>
                </div>
                <StatusBadge status={homework.status} dueDate={due} />
              </div>

              <div className="space-y-2">
                {metaLine ? (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    <span className="min-w-0 truncate">{metaLine}</span>
                  </div>
                ) : null}

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span className="min-w-0 truncate">
                    {homework.teacher?.teacher_name ?? "Unknown"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Due: {formatDate(due)}</span>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                  <AttachmentIndicator count={attachCount} />
                </div>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}
