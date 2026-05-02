import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MessageSquare } from "lucide-react";
import ChatInbox from "../../components/chat/ChatInbox";
import ChatThread from "../../components/chat/ChatThread";

const BASE = "/student/chat";

export default function StudentMessages() {
  const { t } = useTranslation();
  const { conversationId } = useParams();
  return (
    <div className="flex min-h-0 flex-1 flex-row">
      {/* Inbox sidebar — hidden on mobile when a thread is open */}
      <div
        className={`flex min-h-0 flex-col border-r border-[var(--color-border)] md:w-80 md:shrink-0 ${
          conversationId ? "hidden md:flex" : "flex w-full"
        }`}
      >
        <ChatInbox
          mode="student"
          threadBase={BASE}
          activeId={conversationId ?? ""}
        />
      </div>

      {/* Thread panel */}
      {conversationId ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <ChatThread conversationId={conversationId} backTo={BASE} />
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
