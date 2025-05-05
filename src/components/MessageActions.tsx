import React, { useState, useEffect } from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  MoreHorizontal, 
  Copy, 
  Forward, 
  Download,
  Check,
  Pencil,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { Message, Chat } from "@/lib/types";
import { default as ChatPreview } from "@/components/ChatPreview";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { database } from "@/lib/firebase.index";
import { ref, onValue, off } from "firebase/database";
import MessageEditDialog from "./MessageEditDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";

interface MessageActionsProps {
  message: Message;
}

const MessageActions: React.FC<MessageActionsProps> = ({ message }) => {
  const { currentUser } = useAuth();
  const { state, dispatch, forwardMessage, deleteMessage } = useChat();
  const [isForwardDialogOpen, setIsForwardDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [availableChats, setAvailableChats] = useState<Chat[]>([]);
  const [isForwarding, setIsForwarding] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [isUserMessage, setIsUserMessage] = useState(false);

  // Use a LRU cache for better performance with message checks
  const messageChecksCache = useTimeBasedCache<string, boolean>(100, 60_000);

  // Debug for message ownership
  useEffect(() => {
    console.debug("[Message Debug] Message:", message.id, "Sender:", message.senderId, "Current User:", currentUser?.uid);
  }, [message, currentUser]);

  // Check if message belongs to current user and is within 5 minutes
  useEffect(() => {
    if (!currentUser) return;
    
    // Use cached result if available
    const cacheKey = `msg-${message.id}-user-${currentUser.uid}`;
    const cachedValue = messageChecksCache.get(cacheKey);
    
    if (cachedValue !== undefined) {
      setIsUserMessage(cachedValue);
      return;
    }

    // Otherwise compute and cache
    const isOwnMessage = message.senderId === currentUser.uid;
    console.debug("[Message Debug] Is own message:", isOwnMessage, "Message ID:", message.id);
    setIsUserMessage(isOwnMessage);
    messageChecksCache.set(cacheKey, isOwnMessage);
    
    if (isOwnMessage) {
      const fiveMinutesInMs = 5 * 60 * 1000;
      const isWithinTimeLimit = Date.now() - message.timestamp <= fiveMinutesInMs;
      console.debug("[Message Debug] Is within time limit:", isWithinTimeLimit, "Message timestamp:", message.timestamp);
      setCanEdit(isWithinTimeLimit);
    }
  }, [message, currentUser]);

  // Fetch available chats when the forward dialog opens
  useEffect(() => {
    if (isForwardDialogOpen && currentUser) {
      const chatsRef = ref(database, "chats");
      const unsubscribe = onValue(chatsRef, (snapshot) => {
        const chatList: Chat[] = [];
        
        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            const data = childSnapshot.val();
            // Only include chats where the current user is a participant
            if (data.users && data.users.includes(currentUser.uid)) {
              chatList.push({
                id: childSnapshot.key || "",
                type: data.type || "direct",
                users: data.users || [],
                groupName: data.groupName || "",
                groupPhoto: data.groupPhoto || "",
                lastMessage: data.lastMessage || null,
                createdAt: data.createdAt || Date.now(),
                updatedAt: data.updatedAt || Date.now(),
                creator: data.creator || currentUser.uid,
              });
            }
          });
          
          // Sort chats by updatedAt in descending order for better UX
          chatList.sort((a, b) => b.updatedAt - a.updatedAt);
          setAvailableChats(chatList);
        }
      }, (error) => {
        console.error("Error fetching chats:", error);
        toast.error("Failed to load chats for forwarding");
      });

      return () => off(chatsRef);
    }
  }, [isForwardDialogOpen, currentUser]);

  // Handle copy message
  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.text);
    setCopySuccess(true);
    toast.success("Message copied to clipboard");
    
    // Reset copy success icon after 2 seconds
    setTimeout(() => {
      setCopySuccess(false);
    }, 2000);
  };

  // Handle download attachment
  const handleDownloadAttachment = (attachment: any) => {
    if (!attachment || !attachment.url) {
      toast.error("Invalid attachment");
      return;
    }
    
    // Download as blob instead of opening in a new tab
    fetch(attachment.url)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = attachment.name || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success("Downloading attachment");
      })
      .catch(error => {
        console.error("Error downloading attachment:", error);
        toast.error("Failed to download attachment");
      });
  };

  // Handle forward message
  const handleForwardMessage = async (chatId: string) => {
    if (isForwarding) return;
    
    setIsForwarding(true);
    try {
      await forwardMessage(
        message.text, 
        chatId, 
        message.attachments
      );
      setIsForwardDialogOpen(false);
      toast.success("Message forwarded successfully");
    } catch (error) {
      console.error("Error forwarding message:", error);
      toast.error("Failed to forward message");
    } finally {
      setIsForwarding(false);
    }
  };

  // Handle edit message
  const handleEditMessage = () => {
    setIsEditDialogOpen(true);
  };

  // Handle delete message
  const handleDeleteMessage = async () => {
    try {
      await deleteMessage(message.id);
      setIsDeleteDialogOpen(false);
      toast.success("Message deleted successfully");
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full opacity-70 hover:opacity-100">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Message actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40 bg-background">
          <DropdownMenuItem onClick={handleCopyMessage} className="flex items-center gap-2">
            {copySuccess ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span>Copy</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => setIsForwardDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Forward className="h-4 w-4" />
            <span>Forward</span>
          </DropdownMenuItem>
          
          {message.attachments && message.attachments.length > 0 && (
            <DropdownMenuItem 
              onClick={() => handleDownloadAttachment(message.attachments![0])}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </DropdownMenuItem>
          )}
          
          {isUserMessage && canEdit && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleEditMessage}
                className="flex items-center gap-2"
              >
                <Pencil className="h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => setIsDeleteDialogOpen(true)}
                className="flex items-center gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Forward Dialog */}
      <Dialog open={isForwardDialogOpen} onOpenChange={setIsForwardDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Forward Message</DialogTitle>
          </DialogHeader>
          
          <div className="mb-4 bg-muted/30 p-3 rounded-md">
            <p className="text-sm whitespace-pre-wrap">{message.text}</p>
            
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground">With attachment</p>
                {message.attachments[0].type === 'image' && (
                  <div className="mt-1 h-16 w-16 rounded overflow-hidden bg-muted">
                    <img 
                      src={message.attachments[0].url} 
                      alt="Preview" 
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          
          <ScrollArea className="h-[300px] pr-4">
            {availableChats.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No chats available
              </div>
            ) : (
              <div className="space-y-2">
                {availableChats.map((chat) => (
                  <div 
                    key={chat.id}
                    onClick={() => handleForwardMessage(chat.id)}
                    className="cursor-pointer hover:bg-accent/50 rounded-lg transition-colors"
                  >
                    <ChatPreview 
                      chat={chat} 
                      onSelect={() => {}} 
                      isActive={false}
                    />
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
      {/* Edit Message Dialog */}
      {isUserMessage && canEdit && (
        <MessageEditDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          message={message}
        />
      )}
      
      {/* Delete Message Alert Dialog */}
      {isUserMessage && canEdit && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Message</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this message? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteMessage} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};

// Custom LRU cache with time-based expiration for better performance
function useTimeBasedCache<K, V>(capacity: number, ttlMs: number) {
  const cache = new Map<K, { value: V, timestamp: number }>();
  
  const get = (key: K): V | undefined => {
    const item = cache.get(key);
    if (!item) return undefined;
    
    // Check if item has expired
    if (Date.now() - item.timestamp > ttlMs) {
      cache.delete(key);
      return undefined;
    }
    
    return item.value;
  };
  
  const set = (key: K, value: V): void => {
    // If we're at capacity, remove oldest item
    if (cache.size >= capacity) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }
    
    cache.set(key, { value, timestamp: Date.now() });
  };
  
  return { get, set };
}

export default MessageActions;