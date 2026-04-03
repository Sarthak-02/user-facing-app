import { useParams } from "react-router-dom";
import ChatInbox from "../../components/chat/ChatInbox";
import ChatThread from "../../components/chat/ChatThread";

const BASE = "/student/chat";

export default function StudentMessages() {
  const { conversationId } = useParams();
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {conversationId ? (
        <ChatThread conversationId={conversationId} backTo={BASE} />
      ) : (
        <ChatInbox mode="student" threadBase={BASE} />
      )}
    </div>
  );
}
