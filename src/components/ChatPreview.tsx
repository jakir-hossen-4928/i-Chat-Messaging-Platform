
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { database } from "@/lib/firebase.index";
import { ref, get } from "firebase/database";
import { useAuth } from "@/contexts/AuthContext";
import { Chat, User } from "@/lib/types";

interface ChatPreviewProps {
  chat: Chat;
  onSelect: () => void;
  isActive?: boolean; // Make isActive optional with a default value
}

const ChatPreview = ({ chat, onSelect, isActive = false }: ChatPreviewProps) => {
  const { currentUser } = useAuth();
  const [otherUser, setOtherUser] = useState<User | null>(null);

  useEffect(() => {
    // Only fetch the other user for direct chats
    if (chat.type === "direct" && currentUser) {
      const otherUserId = chat.users.find((id) => id !== currentUser.uid);

      if (otherUserId) {
        const fetchUser = async () => {
          try {
            const userRef = ref(database, `users/${otherUserId}`);
            const userSnap = await get(userRef);

            if (userSnap.exists()) {
              const userData = userSnap.val();
              setOtherUser({
                uid: otherUserId,
                displayName: userData.displayName || 'User',
                email: userData.email,
                photoURL: userData.photoURL,
                status: userData.status || 'offline',
                lastSeen: userData.lastSeen,
                createdAt: userData.createdAt,
                updatedAt: userData.updatedAt
              });
            }
          } catch (error) {
            console.error("Error fetching user:", error);
          }
        };

        fetchUser();
      }
    }
  }, [chat, currentUser]);

  const displayName = chat.type === "direct" ? otherUser?.displayName : chat.groupName;
  const photoURL = chat.type === "direct" ? otherUser?.photoURL : chat.groupPhoto;
  const status = chat.type === "direct" ? otherUser?.status : undefined;

  const formatTimestamp = (timestamp: number | undefined): string => {
    if (!timestamp) return "";
    return format(new Date(timestamp), "HH:mm");
  };

  const lastMsgTime = chat.lastMessage?.timestamp
    ? formatTimestamp(chat.lastMessage.timestamp)
    : "";

  const truncateMessage = (message: string) => {
    return message.length > 30 ? message.substring(0, 27) + "..." : message;
  };

  return (
    <div
      className={`flex items-center p-3 hover:bg-accent rounded-lg cursor-pointer ${isActive ? 'bg-accent' : ''}`}
      onClick={onSelect}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={photoURL || undefined} />
        <AvatarFallback className="bg-indigo-500 text-white">
          {displayName?.charAt(0) || (chat.type === "group" ? "G" : "U")}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 ml-4 min-w-0">
        <div className="flex justify-between">
          <div className="font-medium truncate">{displayName || "Unknown"}</div>
          <div className="text-xs text-muted-foreground">{lastMsgTime}</div>
        </div>
        <div className="flex items-center">
          <p className="text-sm text-muted-foreground truncate">
            {chat.lastMessage ? truncateMessage(chat.lastMessage.text) : "Start a conversation"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatPreview;
