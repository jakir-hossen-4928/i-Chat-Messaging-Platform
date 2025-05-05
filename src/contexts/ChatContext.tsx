import React, { createContext, useContext, useReducer, useCallback } from "react";
import { database } from "@/lib/firebase.index";
import { ref, push, set, update, onValue, remove } from "firebase/database";
import { useAuth } from "./AuthContext";
import { Chat, ChatAction, ChatContextType, Message } from "@/lib/types";
import { toast } from "sonner";

// Create context with default values
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Initial state for the chat reducer
const initialState = {
  currentChat: null,
  messages: [],
  typingStatus: {},
  chats: [],
};

// Chat reducer function
const chatReducer = (state: any, action: ChatAction) => {
  switch (action.type) {
    case "SET_CURRENT_CHAT":
      return { ...state, currentChat: action.payload };
    case "SET_MESSAGES":
      return { ...state, messages: action.payload };
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.payload] };
    case "UPDATE_MESSAGE":
      return {
        ...state,
        messages: state.messages.map((msg: Message) =>
          msg.id === action.payload.messageId
            ? { ...msg, ...action.payload.updates }
            : msg
        ),
      };
    case "DELETE_MESSAGE":
      return {
        ...state,
        messages: state.messages.filter((msg: Message) => msg.id !== action.payload),
      };
    case "SET_TYPING_STATUS":
      return {
        ...state,
        typingStatus: {
          ...state.typingStatus,
          [action.payload.chatId]: action.payload.isTyping,
        },
      };
    case "SET_CHATS":
      return { ...state, chats: action.payload };
    default:
      return state;
  }
};

// Provider component
export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { currentUser } = useAuth();

  // Send message function
  const sendMessage = useCallback(
    async (text: string, imageUrl?: string): Promise<void> => {
      if (!currentUser || !state.currentChat) return;

      try {
        const messagesRef = ref(database, `messages/${state.currentChat.id}`);
        const newMessageRef = push(messagesRef);
        const messageId = newMessageRef.key;

        const messageData: Partial<Message> = {
          id: messageId || "",
          chatId: state.currentChat.id,
          senderId: currentUser.uid,
          text: text,
          timestamp: Date.now(),
          read: false,
          edited: false,
        };

        if (imageUrl) {
          messageData.attachments = [
            {
              url: imageUrl,
              type: "image",
              name: `image_${Date.now()}`,
              size: 0,
            },
          ];
        }

        await update(ref(database, `chats/${state.currentChat.id}`), {
          lastMessage: {
            text: text.length > 30 ? text.substring(0, 30) + "..." : text,
            timestamp: Date.now(),
            senderId: currentUser.uid,
          },
          updatedAt: Date.now(),
        });

        await set(newMessageRef, messageData);
      } catch (error) {
        console.error("Error sending message:", error);
        toast.error("Failed to send message");
        throw error;
      }
    },
    [currentUser, state.currentChat]
  );

  // Forward message to another chat
  const forwardMessage = useCallback(
    async (messageText: string, chatId: string, attachments?: any[]): Promise<void> => {
      if (!currentUser) return;

      try {
        const messagesRef = ref(database, `messages/${chatId}`);
        const newMessageRef = push(messagesRef);
        const messageId = newMessageRef.key;

        const messageData: Partial<Message> = {
          id: messageId || "",
          chatId: chatId,
          senderId: currentUser.uid,
          text: messageText,
          timestamp: Date.now(),
          read: false,
        };

        if (attachments && attachments.length > 0) {
          messageData.attachments = attachments;
        }

        await update(ref(database, `chats/${chatId}`), {
          lastMessage: {
            text: messageText.length > 30 ? messageText.substring(0, 30) + "..." : messageText,
            timestamp: Date.now(),
            senderId: currentUser.uid,
          },
          updatedAt: Date.now(),
        });

        await set(newMessageRef, messageData);
      } catch (error) {
        console.error("Error forwarding message:", error);
        toast.error("Failed to forward message");
        throw error;
      }
    },
    [currentUser]
  );

  // Edit message
  const editMessage = useCallback(
    async (messageId: string, newText: string): Promise<void> => {
      if (!currentUser || !state.currentChat) return;

      try {
        const messageRef = ref(database, `messages/${state.currentChat.id}/${messageId}`);
        let messageData = null;

        // Fetch message data
        await new Promise((resolve, reject) => {
          onValue(
            messageRef,
            (snapshot) => {
              if (snapshot.exists()) {
                messageData = snapshot.val();
                resolve(snapshot);
              } else {
                reject(new Error("Message not found"));
              }
            },
            { onlyOnce: true }
          );
        });

        if (messageData.senderId !== currentUser.uid) {
          throw new Error("You can only edit your own messages");
        }

        await update(messageRef, {
          text: newText,
          edited: true,
        });

        dispatch({
          type: "UPDATE_MESSAGE",
          payload: {
            messageId,
            updates: { text: newText, edited: true },
          },
        });
      } catch (error) {
        console.error("Error editing message:", error);
        toast.error("Failed to edit message");
        throw error;
      }
    },
    [currentUser, state.currentChat, dispatch]
  );

  // Delete message
  const deleteMessage = useCallback(
    async (messageId: string): Promise<void> => {
      if (!currentUser || !state.currentChat) return;

      try {
        const messageRef = ref(database, `messages/${state.currentChat.id}/${messageId}`);
        let messageData = null;

        // Fetch message data
        await new Promise((resolve, reject) => {
          onValue(
            messageRef,
            (snapshot) => {
              if (snapshot.exists()) {
                messageData = snapshot.val();
                resolve(snapshot);
              } else {
                reject(new Error("Message not found"));
              }
            },
            { onlyOnce: true }
          );
        });

        if (messageData.senderId !== currentUser.uid) {
          throw new Error("You can only delete your own messages");
        }

        const messageTime = messageData.timestamp;
        const currentTime = Date.now();
        const fiveMinutesInMs = 5 * 60 * 1000;

        if (currentTime - messageTime > fiveMinutesInMs) {
          throw new Error("You can only delete messages within 5 minutes of sending them");
        }

        await remove(messageRef);

        dispatch({
          type: "DELETE_MESSAGE",
          payload: messageId,
        });

        toast.success("Message deleted");
      } catch (error) {
        console.error("Error deleting message:", error);
        toast.error(error instanceof Error ? error.message : "Failed to delete message");
        throw error;
      }
    },
    [currentUser, state.currentChat, dispatch]
  );

  return (
    <ChatContext.Provider
      value={{
        state,
        dispatch,
        sendMessage,
        forwardMessage,
        editMessage,
        deleteMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook to use the chat context
export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};