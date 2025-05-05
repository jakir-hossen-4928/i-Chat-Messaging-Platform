import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Check, CheckCheck, Download, Clock } from "lucide-react";
import { firestore } from "@/lib/firebase.index";
import { collection, query, where, getDocs } from "firebase/firestore";
import { format } from "date-fns";
import { toast } from "sonner";
import { Message } from "@/lib/types";
import { useMediaQuery } from "@/hooks/use-mobile";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import MessageActions from "./MessageActions";
import { Button } from "./ui/button";
import { useOptimizedMessages } from "@/hooks/use-optimized-messages";
import { Skeleton } from "@/components/ui/skeleton";

interface MessageListProps {
  chatId: string | null;
}

const MessageList: React.FC<MessageListProps> = ({ chatId }) => {
  const { currentUser } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, { displayName: string, photoURL: string }>>({});
  const isMobile = useMediaQuery("(max-width: 640px)");
  const containerRef = useRef<HTMLDivElement>(null);
  const { messages, loading, hasMore, loadMore } = useOptimizedMessages(chatId, 20);

  useGSAP(() => {
    if (containerRef.current) {
      const messageElements = containerRef.current.querySelectorAll('.message-appear');
      if (messages.length > 0 && messageElements.length > 0) {
        gsap.fromTo(
          messageElements,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power3.out" }
        );
      }
    }
  }, [messages]);

  useEffect(() => {
    if (!messages.length) return;

    const uniqueSenderIds = [...new Set(messages.map(msg => msg.senderId))];

    uniqueSenderIds.forEach(async senderId => {
      try {
        const userQuery = query(collection(firestore, "users"), where("uid", "==", senderId));
        const snapshot = await getDocs(userQuery);

        if (!snapshot.empty) {
          const userData = snapshot.docs[0].data();
          setUserProfiles(prev => ({
            ...prev,
            [senderId]: {
              displayName: userData.displayName || "User",
              photoURL: userData.photoURL || ""
            }
          }));
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    });
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDownload = (attachment: any) => {
    try {
      if (!attachment || !attachment.url) {
        toast.error("Invalid attachment");
        return;
      }

      fetch(attachment.url)
        .then(response => response.blob())
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = attachment.name || 'image';
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
    } catch (error) {
      console.error("Error downloading attachment:", error);
      toast.error("Failed to download attachment");
    }
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};

    messages.forEach(message => {
      const date = format(new Date(message.timestamp), "yyyy-MM-dd");
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return groups;
  };

  const formatMessageDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const bdTime = new Date(timestamp).toLocaleString('en-US', {
      timeZone: 'Asia/Dhaka',
    });
    const bdDate = new Date(bdTime);

    const bdToday = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Dhaka',
    });
    const bdTodayDate = new Date(bdToday);

    const bdYesterday = new Date(bdTodayDate);
    bdYesterday.setDate(bdTodayDate.getDate() - 1);

    if (bdDate.toDateString() === bdTodayDate.toDateString()) {
      return "Today";
    } else if (bdDate.toDateString() === bdYesterday.toDateString()) {
      return "Yesterday";
    } else {
      return new Date(timestamp).toLocaleString('en-US', {
        timeZone: 'Asia/Dhaka',
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.classList.remove('opacity-0');
  };

  const formatTimestamp = (timestamp: number) => {
    try {
      return new Date(timestamp).toLocaleString('en-US', {
        timeZone: 'Asia/Dhaka',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error("Error formatting timestamp:", error, timestamp);
      return "Invalid time";
    }
  };

  const messageGroups = groupMessagesByDate(messages);

  if (loading && messages.length === 0) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="flex justify-center">
          <Skeleton className="h-4 w-20" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={cn("flex mb-4", i % 2 === 0 ? "justify-end" : "justify-start")}>
            {i % 2 !== 0 && (
              <Skeleton className="h-8 w-8 rounded-full mr-2" />
            )}
            <div className={cn("flex flex-col gap-1", i % 2 === 0 ? "items-end" : "items-start")}>
              <Skeleton className={cn("h-16 w-60", i % 2 === 0 ? "rounded-tl-2xl rounded-bl-2xl rounded-tr-none rounded-br-2xl" : "rounded-tr-2xl rounded-br-2xl rounded-tl-none rounded-bl-2xl")} />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6" ref={containerRef}>
      {hasMore && (
        <div className="flex justify-center py-2">
          <Button variant="outline" size="sm" onClick={loadMore} className="text-xs">
            {loading ? "Loading..." : "Load Earlier Messages"}
          </Button>
        </div>
      )}

      {Object.entries(messageGroups).map(([date, dateMessages]) => (
        <div key={date} className="space-y-4">
          <div className="flex justify-center">
            <div className="px-3 py-1 rounded-full bg-secondary/30 text-secondary-foreground text-xs">
              {formatMessageDate(dateMessages[0].timestamp)}
            </div>
          </div>

          {dateMessages.map((message) => {
            const isSender = message.senderId === currentUser?.uid;
            const showAvatar = !isSender && message.senderId !== dateMessages[dateMessages.indexOf(message) - 1]?.senderId;

            return (
              <div key={message.id} className="message-appear">
                <div className={cn(
                  "message-container flex",
                  isSender ? "justify-end" : "justify-start",
                  isSender ? "sender-message" : "receiver-message"
                )}>
                  {!isSender && (
                    <div className="message-avatar">
                      {showAvatar ? (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={userProfiles[message.senderId]?.photoURL || undefined} />
                          <AvatarFallback>
                            {userProfiles[message.senderId]?.displayName?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-8" />
                      )}
                    </div>
                  )}

                  <div
                    className={cn(
                      "message-content-wrapper group",
                      isSender ? "items-end" : "items-start"
                    )}
                  >
                    <div className="relative">
                      <div className="message-bubble">
                        {message.text && (
                          <p className="whitespace-pre-wrap text-sm">{message.text}</p>
                        )}

                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-1">
                            {message.attachments.map((attachment, index) => (
                              <div key={index} className="rounded-md overflow-hidden">
                                {attachment.type === 'image' && (
                                  <div
                                    className="relative cursor-pointer hover:opacity-95 transition-opacity"
                                    onClick={() => window.open(attachment.url, '_blank')}
                                  >
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 bg-black/50 text-white rounded-full"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDownload(attachment);
                                        }}
                                      >
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    </div>
                                    <img
                                      src={attachment.url}
                                      alt="Attachment"
                                      className="max-h-60 opacity-0 transition-opacity duration-300"
                                      onLoad={handleImageLoad}
                                      loading="lazy"
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div
                        className={cn(
                          "message-actions",
                          isSender ? "-left-8" : "-right-8"
                        )}
                      >
                        <MessageActions message={message} />
                      </div>
                    </div>

                    <div className="message-timestamp flex items-center gap-1 text-xs opacity-70">
                      <span>{formatTimestamp(message.timestamp)}</span>
                      {isSender && (
                        <>
                          {message.status === "sent" ? (
                            <Check className="h-3 w-3" />
                          ) : message.status === "delivered" ? (
                            <CheckCheck className="h-3 w-3" />
                          ) : message.status === "read" ? (
                            <CheckCheck className="h-3 w-3 text-blue-500" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                        </>
                      )}
                      {(message.edited || message.isEdited) && (
                        <span className="text-[10px]">(edited)</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;