import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { database } from "@/lib/firebase.index";
import { ref, onValue, off } from "firebase/database";
import { toast } from "sonner";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Chat } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

interface ChatsProps {
  searchTerm: string;
  onChatSelect: (chat: Chat) => void;
}

const Chats: React.FC<ChatsProps> = ({ searchTerm, onChatSelect }) => {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfiles, setUserProfiles] = useState<
    Record<string, { displayName: string; email: string; photoURL: string }>
  >({});
  const listRef = useRef(null);

  // GSAP animations for scrollable list
  useGSAP(() => {
    const chatItems = document.querySelectorAll(".chat-item");
    if (chats.length > 0 && chatItems.length > 0) {
      gsap.fromTo(
        chatItems,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, stagger: 0.05, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [chats]);

  // Fetch user profiles for search functionality
  useEffect(() => {
    if (!currentUser) return;

    const usersRef = ref(database, "users");
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const userList: Record<
        string,
        { displayName: string; email: string; photoURL: string }
      > = {};

      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const userId = childSnapshot.key;
          const data = childSnapshot.val();

          if (userId) {
            userList[userId] = {
              displayName: data.displayName || "User",
              email: data.email || "",
              photoURL: data.photoURL || "",
            };
          }
        });
      }

      setUserProfiles(userList);
    });

    return () => off(usersRef);
  }, [currentUser]);

  // Fetch chats
  useEffect(() => {
    if (!currentUser) return;

    try {
      const chatsRef = ref(database, "chats");

      const unsubscribe = onValue(
        chatsRef,
        (snapshot) => {
          const chatList: Chat[] = [];

          if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
              const data = childSnapshot.val();
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

            chatList.sort((a, b) => b.updatedAt - a.updatedAt);
          }

          setChats(chatList);
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching chats:", error);
          toast.error("Failed to load chats");
          setLoading(false);
        }
      );

      return () => off(chatsRef);
    } catch (error) {
      console.error("Error setting up chats listener:", error);
      setLoading(false);
    }
  }, [currentUser]);

  const handleChatSelect = (chat: Chat) => {
    onChatSelect(chat);
  };

  // Format time to Bangladesh 12-hour format
  const formatTime = (timestamp: number) => {
    try {
      return new Date(timestamp).toLocaleString("en-US", {
        timeZone: "Asia/Dhaka",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      console.error("Error formatting time:", error);
      return "";
    }
  };

  const filteredChats = chats.filter((chat) => {
    if (searchTerm === "") return true;
    const searchTermLower = searchTerm.toLowerCase();

    if (chat.type === "group") {
      return chat.groupName?.toLowerCase().includes(searchTermLower);
    } else {
      const otherUserId = chat.users.find((id) => id !== currentUser?.uid);
      if (!otherUserId) return false;

      const otherUser = userProfiles[otherUserId];
      if (!otherUser) return false;

      return (
        otherUser.displayName.toLowerCase().includes(searchTermLower) ||
        otherUser.email.toLowerCase().includes(searchTermLower)
      );
    }
  });

  if (loading) {
    return (
      <div className="space-y-2 p-4 pt-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm"
          >
            <div className="flex items-center space-x-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-10" />
                </div>
                <Skeleton className="h-3 w-40 mt-1" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="p-4 pt-6 text-center text-muted-foreground">
        No chats yet. Start a conversation with a user!
      </div>
    );
  }

  return (
    <div
      className="space-y-2 p-2 pt-6 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-300 scrollbar-track-transparent"
      ref={listRef}
    >
      {filteredChats.map((chat) => (
        <div
          key={chat.id}
          className="chat-item transition-all duration-300 ease-in-out opacity-100"
          onClick={() => handleChatSelect(chat)}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 cursor-pointer shadow-sm transform transition-transform hover:shadow-md">
            <div className="flex items-center space-x-3">
              {/* Avatar */}
              {chat.type === "group" ? (
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  {chat.groupPhoto ? (
                    <img
                      src={chat.groupPhoto}
                      alt="Group"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center">
                      <span className="text-lg font-semibold">
                        {chat.groupName?.charAt(0) || "G"}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  {userProfiles[
                    chat.users.find((id) => id !== currentUser?.uid) || ""
                  ]?.photoURL ? (
                    <img
                      src={
                        userProfiles[
                          chat.users.find((id) => id !== currentUser?.uid) || ""
                        ]?.photoURL
                      }
                      alt="User"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center">
                      <span className="text-lg font-semibold">
                        {userProfiles[
                          chat.users.find((id) => id !== currentUser?.uid) || ""
                        ]?.displayName.charAt(0) || "U"}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Chat info */}
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold truncate">
                    {chat.type === "group"
                      ? chat.groupName
                      : userProfiles[
                        chat.users.find((id) => id !== currentUser?.uid) || ""
                      ]?.displayName || "User"}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {chat.lastMessage
                      ? formatTime(chat.lastMessage.timestamp)
                      : formatTime(chat.updatedAt)}
                  </span>
                </div>
                {chat.lastMessage && (
                  <div className="flex items-center space-x-2">
                    {chat.lastMessage.attachments &&
                      chat.lastMessage.attachments.length > 0 &&
                      chat.lastMessage.attachments[0].type.startsWith("image") ? (
                      <>
                        <img
                          src={chat.lastMessage.attachments[0].url}
                          alt="Last message"
                          className="w-6 h-6 rounded-sm object-cover"
                          onError={(e) =>
                            (e.currentTarget.src = "/placeholder-image.png")
                          } // Fallback image
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          Image
                        </span>
                      </>
                    ) : (
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {chat.lastMessage.text
                          ? `${chat.lastMessage.text.slice(0, 6)}${chat.lastMessage.text.length > 6 ? '...' : ''}`
                          : (
                            <>
                              <img
                                width="16"
                                height="16"
                                src="https://img.icons8.com/fluency/48/image--v1.png"
                                alt="image"
                                className="inline"
                              />
                              <span className="inline">Image sent</span>
                            </>
                          )}
                      </p>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Chats;