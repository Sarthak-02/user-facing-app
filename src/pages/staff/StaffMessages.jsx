import { useParams } from "react-router-dom";
import ChatInbox from "../../components/chat/ChatInbox";
import ChatThread from "../../components/chat/ChatThread";

const BASE = "/staff/chat";

export default function StaffMessages() {
  const { conversationId } = useParams();
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {conversationId ? (
        <ChatThread conversationId={conversationId} backTo={BASE} />
      ) : (
        <ChatInbox mode="staff" threadBase={BASE} />
      )}
    </div>
  );
}
