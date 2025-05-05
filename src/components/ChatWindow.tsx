import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { database } from "@/lib/firebase.index";
import { ref, onValue, off, set, update, get } from "firebase/database";
import {
  MessageSquare,
  Menu,
  X,
  Image as ImageIcon,
  Settings
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMediaQuery } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import EmojiPicker from "./EmojiPicker";
import UserProfileView from "./user/UserProfileView";
import ChatThemeSelector from "./ChatThemeSelector";
import GroupOperationsDialog from "./GroupOperationsDialog";
import MessageList from "./MessageList";

interface ChatWindowProps {
  onToggleSidebar?: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ onToggleSidebar }) => {
  const { currentUser } = useAuth();
  const { state, dispatch, sendMessage: contextSendMessage } = useChat();
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [chatPartner, setChatPartner] = useState<{
    uid: string;
    displayName: string;
    photoURL: string;
    email: string | null;
    status?: "online" | "offline";
    bio?: string;
    lastSeen?: number;
  } | null>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // For draggable message button
  const [msgButtonPosition, setMsgButtonPosition] = useState({ x: 20, y: -80 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  // For user profile view
  const [isProfileViewOpen, setIsProfileViewOpen] = useState(false);

  // For image uploads
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  // For group operations dialog
  const [isGroupOperationsOpen, setIsGroupOperationsOpen] = useState(false);

  // Get chat partner details for direct chats
  useEffect(() => {
    if (!currentUser || !state.currentChat || state.currentChat.type !== "direct") return;

    const otherUserId = state.currentChat.users.find(id => id !== currentUser.uid);
    if (otherUserId) {
      const userRef = ref(database, `users/${otherUserId}`);
      get(userRef).then((snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.val();
          setChatPartner({
            uid: otherUserId,
            displayName: userData.displayName || "User",
            photoURL: userData.photoURL || "",
            email: userData.email || null,
            status: userData.status || "offline",
            bio: userData.bio || "",
            lastSeen: userData.lastSeen || null,
          });
        }
      }).catch(error => {
        console.error("Error fetching chat partner:", error);
      });
    }
  }, [currentUser, state.currentChat]);

  // Handle opening user profile view
  const handleOpenProfileView = () => {
    if (chatPartner) {
      setIsProfileViewOpen(true);
    }
  };

  // Handle typing status
  const handleTyping = () => {
    if (!currentUser || !state.currentChat) return;

    const typingRef = ref(database, `typing/${state.currentChat.id}/${currentUser.uid}`);
    set(typingRef, true);

    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    const timeout = setTimeout(() => {
      if (state.currentChat) {
        const typingRef = ref(database, `typing/${state.currentChat.id}/${currentUser.uid}`);
        set(typingRef, false);
      }
    }, 2000);

    setTypingTimeout(timeout);
  };

  // Listen for typing status from other users
  useEffect(() => {
    if (!currentUser || !state.currentChat) return;

    const typingRef = ref(database, `typing/${state.currentChat.id}`);
    const unsubscribe = onValue(typingRef, (snapshot) => {
      const typingData = snapshot.val() || {};

      const someoneIsTyping = Object.entries(typingData).some(
        ([uid, isTyping]) => uid !== currentUser.uid && isTyping
      );

      setIsTyping(someoneIsTyping);
    });

    return () => {
      off(typingRef);
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, [currentUser, state.currentChat, typingTimeout]);

  // Handle emoji insertion
  const handleEmojiSelect = (emoji: string) => {
    setMessage((prev) => prev + emoji);
  };

  // Handle image selection and upload
  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const imageUrl = await new Promise<string>((resolve) => {
        setTimeout(() => {
          resolve(URL.createObjectURL(file));
        }, 1000);
      });

      setUploadedImageUrl(imageUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle sending messages
  const handleSendMessage = async () => {
    if (!currentUser || !state.currentChat) return;

    try {
      if (message.trim() || uploadedImageUrl) {
        await contextSendMessage(message.trim(), uploadedImageUrl || undefined);
        setMessage("");
        setUploadedImageUrl(null);

        if (state.currentChat) {
          const typingRef = ref(database, `typing/${state.currentChat.id}/${currentUser.uid}`);
          await set(typingRef, false);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  // Handle key press for sending messages
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Cancel image upload
  const cancelImageUpload = () => {
    setUploadedImageUrl(null);
  };

  // Handle dragging for message button
  const handleMessageButtonMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - msgButtonPosition.x,
      y: e.clientY - msgButtonPosition.y
    };
  };

  const handleMessageButtonTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragging(true);
    const touch = e.touches[0];
    dragStartPos.current = {
      x: touch.clientX - msgButtonPosition.x,
      y: touch.clientY - msgButtonPosition.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setMsgButtonPosition({
          x: e.clientX - dragStartPos.current.x,
          y: e.clientY - dragStartPos.current.y
        });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length > 0) {
        const touch = e.touches[0];
        setMsgButtonPosition({
          x: touch.clientX - dragStartPos.current.x,
          y: touch.clientY - dragStartPos.current.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  // Handle leaving group
  const handleLeaveGroup = async () => {
    if (!currentUser || !state.currentChat) return;

    try {
      const updatedUsers = state.currentChat.users.filter(uid => uid !== currentUser.uid);
      await update(ref(database, `chats/${state.currentChat.id}`), {
        users: updatedUsers,
        updatedAt: Date.now()
      });
      dispatch({ type: "SET_CURRENT_CHAT", payload: null });
      toast.success("You have left the group");
    } catch (error) {
      console.error("Error leaving group:", error);
      toast.error("Failed to leave group");
    }
  };

  if (!state.currentChat) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <MessageSquare className="h-16 w-16 text-primary mb-4 opacity-50" />
        <h2 className="text-xl font-medium mb-2">Welcome to i-Chat</h2>
        <p className="text-muted-foreground max-w-md">
          Select a chat to start messaging or find new contacts in the Users tab
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center p-3 border-b bg-background/95 backdrop-blur-sm shadow-sm">
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <Avatar
          className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all"
          onClick={handleOpenProfileView}
        >
          <AvatarImage src={state.currentChat.type === "direct" ? chatPartner?.photoURL : state.currentChat.groupPhoto} />
          <AvatarFallback className="bg-primary/20">
            {state.currentChat.type === "direct"
              ? (chatPartner?.displayName?.charAt(0) || "U")
              : (state.currentChat.groupName?.charAt(0) || "G")}
          </AvatarFallback>
        </Avatar>
        <div className="ml-3 flex-1 truncate">
          <h2 className="font-medium truncate">
            {state.currentChat.type === "direct"
              ? chatPartner?.displayName || "User"
              : state.currentChat.groupName}
          </h2>
          {isTyping && <p className="text-sm text-muted-foreground">typing...</p>}
        </div>

        <ChatThemeSelector />

        {state.currentChat.type === "group" && (
          <Button variant="ghost" size="icon" onClick={() => setIsGroupOperationsOpen(true)} className="rounded-full">
            <Settings className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden bg-gradient-to-b from-background/80 to-background/60 bg-fixed bg-[url('/chat-bg.png')] bg-opacity-5">
        <ScrollArea className="h-full p-3">
          <MessageList chatId={state.currentChat.id} />
        </ScrollArea>
      </div>

      {/* Message Input */}
      <div className="p-2 border-t bg-background/95 backdrop-blur-sm">
        {uploadedImageUrl && (
          <div className="mb-2 p-2 border rounded-md bg-background relative">
            <div className="flex items-center gap-2">
              <div className="w-20 h-20 rounded overflow-hidden flex-shrink-0">
                <img src={uploadedImageUrl} alt="Upload preview" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium truncate">
                  Image ready to send
                </p>
                <p className="text-xs text-muted-foreground">
                  Click send to include this image
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={cancelImageUpload}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <div className="flex items-center flex-1 rounded-full border bg-background pr-1">
            <Input
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                handleTyping();
              }}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 rounded-full border-0"
            />
            <div className="flex">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleImageSelect}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="h-5 w-5" />
                <span className="sr-only">Attach image</span>
              </Button>
              <EmojiPicker onSelect={handleEmojiSelect} />
            </div>
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() && !uploadedImageUrl}
            className="rounded-full flex-shrink-0"
            size="icon"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 rotate-90">
              <line x1="22" x2="11" y1="2" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9"></polygon>
            </svg>
          </Button>
        </div>
      </div>

      {isMobile && (
        <div
          className={cn(
            "fixed z-50 transition-all",
            isDragging ? "opacity-70" : "opacity-100"
          )}
          style={{
            bottom: `${msgButtonPosition.y}px`,
            right: `${msgButtonPosition.x}px`
          }}
        >
          <Button
            variant="default"
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-primary to-primary/80"
            onMouseDown={handleMessageButtonMouseDown}
            onTouchStart={handleMessageButtonTouchStart}
          >
            <MessageSquare className="h-6 w-6" />
            <span className="sr-only">New message</span>
          </Button>
        </div>
      )}

      <UserProfileView
        user={chatPartner}
        isOpen={isProfileViewOpen}
        onClose={() => setIsProfileViewOpen(false)}
      />

      <GroupOperationsDialog
        open={isGroupOperationsOpen}
        onOpenChange={setIsGroupOperationsOpen}
        chatId={state.currentChat.id}
        onLeaveGroup={handleLeaveGroup}
      />
    </div>
  );
};

export default ChatWindow;