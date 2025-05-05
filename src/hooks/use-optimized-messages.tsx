
import { useState, useEffect, useCallback, useMemo } from "react";
import { database } from "@/lib/firebase.index";
import { ref, onValue, off, query, orderByChild, limitToLast, get } from "firebase/database";
import { Message } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

/**
 * A custom hook that provides optimized message loading with pagination
 * using a windowing technique for performance.
 */
export function useOptimizedMessages(chatId: string | null, pageSize: number = 20) {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // Memoize the message reference to avoid recreating it
  const messagesRef = useMemo(() => {
    if (!chatId) return null;
    return ref(database, `messages/${chatId}`);
  }, [chatId]);

  // Load initial messages
  useEffect(() => {
    if (!chatId || !currentUser || !messagesRef) {
      setMessages([]);
      setLoading(false);
      setHasMore(false);
      return;
    }

    setLoading(true);
    
    try {
      // Create a query that gets the last pageSize messages
      const messagesQuery = query(
        messagesRef,
        orderByChild('timestamp'),
        limitToLast(pageSize)
      );
      
      const unsubscribe = onValue(messagesQuery, (snapshot) => {
        if (!snapshot.exists()) {
          setMessages([]);
          setHasMore(false);
        } else {
          const messageList: Message[] = [];
          
          snapshot.forEach((childSnapshot) => {
            const data = childSnapshot.val();
            
            // Only add valid messages with required fields
            if (data && data.senderId && data.timestamp) {
              messageList.push({
                id: childSnapshot.key || '',
                chatId: data.chatId || chatId,
                senderId: data.senderId,
                text: data.text || '',
                timestamp: data.timestamp,
                read: !!data.read,
                attachments: data.attachments || undefined,
              });
            }
          });
          
          // Sort messages by timestamp (newest last)
          messageList.sort((a, b) => a.timestamp - b.timestamp);
          
          setMessages(messageList);
          setHasMore(messageList.length === pageSize);
        }
        
        setLoading(false);
      });
      
      return () => {
        unsubscribe();
      };
    } catch (error) {
      console.error("Error fetching messages:", error);
      setLoading(false);
      toast.error("Error loading messages");
      return () => {};
    }
  }, [chatId, currentUser, pageSize, messagesRef]);

  // Function to load more messages (older ones)
  const loadMore = useCallback(async () => {
    if (!chatId || !currentUser || !messagesRef || !hasMore || loading || messages.length === 0) {
      return;
    }

    try {
      setLoading(true);
      
      // Get the oldest message timestamp
      const oldestTimestamp = messages[0]?.timestamp;
      
      if (!oldestTimestamp) {
        setHasMore(false);
        setLoading(false);
        return;
      }
      
      // Query for messages older than the oldest one we have
      const olderMessagesQuery = query(
        messagesRef,
        orderByChild('timestamp'),
        // Limit to messages older than our oldest
        limitToLast(pageSize)
      );
      
      const snapshot = await get(olderMessagesQuery);
      
      if (!snapshot.exists()) {
        setHasMore(false);
      } else {
        const olderMessages: Message[] = [];
        
        snapshot.forEach((childSnapshot) => {
          const data = childSnapshot.val();
          
          // Only include messages that are older than our current oldest
          // and have required fields
          if (data && data.senderId && data.timestamp && data.timestamp < oldestTimestamp) {
            olderMessages.push({
              id: childSnapshot.key || '',
              chatId: data.chatId || chatId,
              senderId: data.senderId,
              text: data.text || '',
              timestamp: data.timestamp,
              read: !!data.read,
              attachments: data.attachments || undefined,
            });
          }
        });
        
        // Sort messages by timestamp (newest last)
        olderMessages.sort((a, b) => a.timestamp - b.timestamp);
        
        // Check if we got fewer messages than requested
        setHasMore(olderMessages.length === pageSize);
        
        // Add older messages to the beginning
        if (olderMessages.length > 0) {
          setMessages(prev => [...olderMessages, ...prev]);
          setPage(prev => prev + 1);
        } else {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error("Error loading more messages:", error);
      toast.error("Failed to load older messages");
    } finally {
      setLoading(false);
    }
  }, [chatId, currentUser, hasMore, loading, messages, messagesRef, pageSize]);

  // Return both the messages and methods to interact with them
  return {
    messages,
    loading,
    hasMore,
    loadMore,
    page
  };
}
