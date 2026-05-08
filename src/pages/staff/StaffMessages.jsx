import { Navigate, useLocation, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MessageSquare } from "lucide-react";
import ChatInbox from "../../components/chat/ChatInbox";
import ChatThread from "../../components/chat/ChatThread";

const BASE = "/staff/chat";

export default function StaffMessages() {
  const { t } = useTranslation();
  const location = useLocation();
  const { conversationId } = useParams();
  const [searchParams] = useSearchParams();

  const isNewChatRoute = location.pathname.endsWith(`${BASE}/new`);
  const draftUserId = isNewChatRoute ? (searchParams.get("with") || "").trim() : "";
  const draftDisplayName = isNewChatRoute ? (searchParams.get("name") || "").trim() : "";

  if (isNewChatRoute && !draftUserId) {
    return <Navigate to={BASE} replace />;
  }

  const threadOpen = Boolean(conversationId) || Boolean(draftUserId);

  return (
    <div className="flex min-h-0 flex-1 flex-row">
      {/* Inbox sidebar — hidden on mobile when a thread is open */}
      <div
        className={`flex min-h-0 flex-col border-r border-[var(--color-border)] md:w-80 md:shrink-0 ${
          threadOpen ? "hidden md:flex" : "flex w-full"
        }`}
      >
        <ChatInbox
          mode="staff"
          threadBase={BASE}
          activeId={conversationId ?? ""}
        />
      </div>

      {/* Thread panel */}
      {threadOpen ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <ChatThread
            key={conversationId || `new-${draftUserId}`}
            conversationId={conversationId}
            draftOtherUserId={draftUserId}
            draftDisplayName={draftDisplayName}
            backTo={BASE}
          />
        </div>
      ) : (
        <div className="hidden md:flex md:flex-1 md:items-center md:justify-center md:bg-[var(--color-background)]">
          <div className="text-center">
            <MessageSquare size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-400">
              {t("chatUi.selectConversation")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
