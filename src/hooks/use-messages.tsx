
import { useState, useEffect } from "react";
import { database } from "@/lib/firebase.index";
import { ref, onValue, off, query, orderByChild } from "firebase/database";
import { Message } from "@/lib/types";
import { toast } from "sonner";

export function useMessages(chatId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    console.log(`Hook: Fetching messages for chat: ${chatId}`);

    try {
      const messagesRef = ref(database, `messages/${chatId}`);
      
      const unsubscribe = onValue(
        messagesRef,
        (snapshot) => {
          console.log(`Hook: Got ${snapshot.size} messages`);

          const messageList: Message[] = [];

          snapshot.forEach((childSnapshot) => {
            const data = childSnapshot.val();
            const messageId = childSnapshot.key || '';
            
            messageList.push({
              id: messageId,
              chatId: data.chatId || chatId,
              senderId: data.senderId,
              text: data.text || '',
              timestamp: data.timestamp,
              read: !!data.read,
              attachments: data.attachments
            });
          });

          // Sort messages by timestamp
          messageList.sort((a, b) => a.timestamp - b.timestamp);
          
          setMessages(messageList);
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching messages:", error);
          toast.error("Failed to load messages. Please try again later.");
          setLoading(false);
        }
      );

      return () => {
        console.log(`Hook: Unsubscribing from messages for chat: ${chatId}`);
        off(messagesRef);
      };
    } catch (error) {
      console.error("Error setting up messages listener:", error);
      setLoading(false);
      return () => {};
    }
  }, [chatId]);

  return { messages, loading };
}
