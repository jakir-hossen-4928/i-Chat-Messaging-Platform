
// User interface representing a user in the application
export interface User {
  uid: string;
  email: string | null;
  displayName: string;
  photoURL?: string;
  status: "online" | "offline";
  lastSeen?: number;
  createdAt: number;
  updatedAt: number;
}

// Chat interface representing a direct or group chat
export interface Chat {
  id: string;
  type: "direct" | "group";
  users: string[];
  groupName?: string;
  groupPhoto?: string;
  lastMessage?: {
    text: string;
    timestamp: number;
    senderId: string;
  };
  createdAt: number;
  updatedAt: number;
  creator: string;  // Made required to match usage
}



// AuthContext interface for the authentication context
export interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
}

// TypingStatus interface for tracking who is typing in a chat
export interface TypingStatus {
  [userId: string]: boolean;
}

// ChatContext interface for the chat context
export interface ChatContextType {
  state: {
    currentChat: Chat | null;
    messages: Message[];
    typingStatus: Record<string, boolean>;
    chats: Chat[];
  };
  dispatch: React.Dispatch<ChatAction>;
  sendMessage: (text: string, imageUrl?: string) => Promise<void>;
  forwardMessage: (messageText: string, chatId: string, attachments?: any[]) => Promise<void>;
  editMessage: (messageId: string, newText: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  startCall: (userId: string, type: "audio" | "video") => Promise<void>;
  answerCall: (callId: string) => Promise<void>;
  endCall: (callId: string) => Promise<void>;
}

// Message interface for chat messages
export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: number;
  read: boolean;
  edited?: boolean;
  isEdited?: boolean; // Added for backward compatibility
  status?: "pending" | "sent" | "delivered" | "read"; // Added missing status field
  attachments?: {
    url: string;
    type: string;
    name: string;
    size: number;
  }[];
}

// ChatAction type for chat context reducer actions
export type ChatAction =
  | { type: "SET_CURRENT_CHAT"; payload: Chat | null }
  | { type: "SET_MESSAGES"; payload: Message[] }
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "UPDATE_MESSAGE"; payload: { messageId: string; updates: Partial<Message> } }
  | { type: "DELETE_MESSAGE"; payload: string }
  | { type: "SET_TYPING_STATUS"; payload: { chatId: string; isTyping: boolean } }
  | { type: "SET_CHATS"; payload: Chat[] };

