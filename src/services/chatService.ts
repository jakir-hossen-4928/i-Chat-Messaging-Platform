import { getDatabase, ref, get, set, push, update, remove, query, orderByChild, equalTo } from 'firebase/database';
import { app } from '@/lib/firebase';
import { toast } from 'sonner';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
}

interface Chat {
  id: string;
  type: 'direct' | 'group';
  participants: string[];
  lastMessage?: Message;
  createdAt: number;
  updatedAt: number;
}

export const createChat = async (participants: string[]): Promise<string> => {
  try {
    const db = getDatabase(app);
    const chatsRef = ref(db, 'chats');
    const newChatRef = push(chatsRef);

    const chat: Chat = {
      id: newChatRef.key!,
      type: 'direct',
      participants,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await set(newChatRef, chat);
    return chat.id;
  } catch (error) {
    console.error('Error creating chat:', error);
    toast.error('Failed to create chat');
    throw error;
  }
};

export const getChat = async (chatId: string): Promise<Chat | null> => {
  try {
    const db = getDatabase(app);
    const chatRef = ref(db, `chats/${chatId}`);
    const snapshot = await get(chatRef);

    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.val() as Chat;
  } catch (error) {
    console.error('Error fetching chat:', error);
    throw error;
  }
};

export const getChats = async (userId: string): Promise<Chat[]> => {
  try {
    const db = getDatabase(app);
    const chatsRef = ref(db, 'chats');
    const chatsQuery = query(
      chatsRef,
      orderByChild('participants'),
      equalTo(userId)
    );

    const snapshot = await get(chatsQuery);
    if (!snapshot.exists()) {
      return [];
    }

    return Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
      id,
      ...data
    }));
  } catch (error) {
    console.error('Error fetching chats:', error);
    throw error;
  }
};

export const sendMessage = async (chatId: string, senderId: string, text: string): Promise<void> => {
  try {
    const db = getDatabase(app);
    const messagesRef = ref(db, `messages/${chatId}`);
    const newMessageRef = push(messagesRef);

    const message: Message = {
      id: newMessageRef.key!,
      senderId,
      text,
      timestamp: Date.now()
    };

    await set(newMessageRef, message);

    // Update chat's last message
    const chatRef = ref(db, `chats/${chatId}`);
    await update(chatRef, {
      lastMessage: message,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error('Error sending message:', error);
    toast.error('Failed to send message');
    throw error;
  }
};

export const getMessages = async (chatId: string): Promise<Message[]> => {
  try {
    const db = getDatabase(app);
    const messagesRef = ref(db, `messages/${chatId}`);
    const messagesQuery = query(messagesRef, orderByChild('timestamp'));

    const snapshot = await get(messagesQuery);
    if (!snapshot.exists()) {
      return [];
    }

    return Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
      id,
      ...data
    }));
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

export const startChatWithFriend = async (userId: string, friendId: string): Promise<string> => {
  try {
    const db = getDatabase(app);
    const chatsRef = ref(db, 'chats');
    const chatsQuery = query(
      chatsRef,
      orderByChild('participants'),
      equalTo([userId, friendId].sort().join(','))
    );

    const snapshot = await get(chatsQuery);
    if (snapshot.exists()) {
      // Return existing chat ID
      return Object.keys(snapshot.val())[0];
    }

    // Create new chat
    return await createChat([userId, friendId]);
  } catch (error) {
    console.error('Error starting chat:', error);
    toast.error('Failed to start chat');
    throw error;
  }
};