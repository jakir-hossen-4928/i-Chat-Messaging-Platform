import React, { useState, useEffect, useMemo } from "react";
import { database } from "@/lib/firebase.index";
import { ref, onValue, off, push, set } from "firebase/database";
import { useAuth } from "@/contexts/AuthContext";
import { User } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format, differenceInHours } from "date-fns";
import { MessageSquare, Phone, Video } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useChat } from "@/contexts/ChatContext";

interface AllUsersProps {
  searchTerm: string;
}

const AllUsers: React.FC<AllUsersProps> = ({ searchTerm }) => {
  const { currentUser } = useAuth();
  const { dispatch } = useChat();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const usersRef = ref(database, "users");

    const unsubscribe = onValue(usersRef, (snapshot) => {
      const usersList: User[] = [];

      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const userData = childSnapshot.val();
          // Exclude the current user
          if (childSnapshot.key !== currentUser.uid && userData.displayName) {
            usersList.push({
              uid: childSnapshot.key || "",
              displayName: userData.displayName,
              email: userData.email || "",
              photoURL: userData.photoURL || "",
              status: userData.status || "offline",
              lastSeen: userData.lastSeen || Date.now(),
              createdAt: userData.createdAt || Date.now(),
              updatedAt: userData.updatedAt || Date.now()
            });
          }
        });
      }

      setUsers(usersList);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
      setIsLoading(false);
    });

    return () => off(usersRef);
  }, [currentUser]);

  // Start a chat with another user
  const handleStartChat = async (userId: string) => {
    if (!currentUser) return;

    try {
      // Check if chat already exists
      const chatsRef = ref(database, "chats");
      let chatExists = false;
      let existingChatId = "";

      const snapshot = await new Promise<any>((resolve) => {
        onValue(ref(database, "chats"), (snapshot) => {
          resolve(snapshot);
        }, { onlyOnce: true });
      });

      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot: any) => {
          const chatData = childSnapshot.val();
          if (
            chatData.type === "direct" &&
            chatData.users.length === 2 &&
            chatData.users.includes(currentUser.uid) &&
            chatData.users.includes(userId)
          ) {
            chatExists = true;
            existingChatId = childSnapshot.key;
          }
        });
      }

      let chatId;

      if (chatExists) {
        chatId = existingChatId;
      } else {
        // Create a new chat
        const newChatRef = push(ref(database, "chats"));
        chatId = newChatRef.key;

        const chatData = {
          id: chatId,
          type: "direct",
          users: [currentUser.uid, userId],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          creator: currentUser.uid
        };

        await set(newChatRef, chatData);
        toast.success("Chat created!");
      }

      // Fetch the full chat object and dispatch it to ChatContext
      onValue(ref(database, `chats/${chatId}`), (snapshot) => {
        if (snapshot.exists()) {
          const chatData = snapshot.val();
          dispatch({
            type: "SET_CURRENT_CHAT",
            payload: {
              ...chatData,
              id: chatId
            }
          });
        }
      }, { onlyOnce: true });

    } catch (error) {
      console.error("Error creating chat:", error);
      toast.error("Failed to start chat");
    }
  };

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return users.filter(user =>
      user.displayName.toLowerCase().includes(lowerSearch) ||
      (user.email && user.email.toLowerCase().includes(lowerSearch))
    );
  }, [users, searchTerm]);

  // User card component
  const UserCard = ({ user }: { user: User }) => {
    const isOnline = user.status === "online" || differenceInHours(new Date(), new Date(user.lastSeen)) < 1;

    return (
      <div className="flex items-center p-3 hover:bg-accent rounded-lg transition-colors">
        <Avatar className="h-10 w-10 md:h-12 md:w-12 relative">
          <AvatarImage src={user.photoURL || ""} />
          <AvatarFallback className="bg-indigo-500 text-white">
            {user.displayName[0]}
          </AvatarFallback>
          <span
            className="absolute bottom-0 right-0 h-2.5 w-2.5 md:h-3 md:w-3 rounded-full border-2 border-background"
            style={{ backgroundColor: isOnline ? "#22c55e" : "#ef4444" }}
          />
        </Avatar>

        <div className="flex-1 ml-4 min-w-0">
          <h3 className="text-sm md:text-base font-semibold truncate">{user.displayName}</h3>
          <p className="text-xs md:text-sm text-muted-foreground truncate">{user.email}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {isOnline ? "Online now" : `Last seen ${format(new Date(user.lastSeen), "dd MMM HH:mm")}`}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleStartChat(user.uid)}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled
          >
            <Phone className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled
          >
            <Video className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <TabsContent value="users" className="mt-4 flex-1 overflow-y-auto">
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center p-3 space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="space-y-2">
          {filteredUsers.map((user) => (
            <UserCard key={user.uid} user={user} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mb-4" />
          <p className="text-lg">No users found</p>
          <p className="text-sm">Try adjusting your search terms</p>
        </div>
      )}
    </TabsContent>
  );
};

export default AllUsers;