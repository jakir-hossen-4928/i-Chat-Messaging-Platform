
import React, { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search, Users, Settings, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useChat } from "@/contexts/ChatContext";
import NewGroupDialog from "./NewGroupDialog";
import UserSettingsDialog from "./UserSettingsDialog";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import Chats from "./subSidebar/Chats";
import AllUsers from "./subSidebar/AllUsers";
import debounce from "lodash/debounce";
import { Chat } from "@/lib/types";

interface SidebarProps {
  onNavigate?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
  const { currentUser, logout } = useAuth();
  const { dispatch } = useChat();
  const [searchTerm, setSearchTerm] = useState("");
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const isMobile = useIsMobile();

  // Debounced search handler
  const debouncedSetSearchTerm = useMemo(
    () => debounce((value: string) => setSearchTerm(value), 300),
    []
  );

  // Handle chat selection
  const handleChatSelect = useCallback(
    (chat: Chat) => {
      dispatch({ type: "SET_CURRENT_CHAT", payload: chat });
      if (onNavigate) onNavigate();
    },
    [dispatch, onNavigate]
  );

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 w-full md:w-80 overflow-hidden">
      {/* Header with Circular Avatar */}
      <div className="p-4 flex items-center justify-center relative">
        <div className="relative">
          <Avatar className="h-16 w-16 md:h-20 md:w-20 border-4 border-white dark:border-gray-800 shadow-lg">
            <AvatarImage src={currentUser?.photoURL || undefined} />
            <AvatarFallback className="bg-indigo-500 text-white text-xl md:text-2xl">
              {currentUser?.displayName?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-2 md:px-4 pb-2 md:pb-4">
        <div className="relative">
          <Search className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 md:h-5 md:w-5" />
          <Input
            placeholder="Search by username or email..."
            className="pl-8 md:pl-10 bg-white dark:bg-gray-800 border-none rounded-full shadow-md text-sm md:text-base focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-600 w-full"
            onChange={(e) => debouncedSetSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs - Simplified to just Chats and Users */}
      <Tabs defaultValue="chats" className="flex-1 flex flex-col px-2 md:px-4 overflow-hidden">
        <TabsList className="grid grid-cols-2 gap-1 md:gap-2 bg-transparent">
          <TabsTrigger
            value="chats"
            className="rounded-full bg-white dark:bg-gray-800 shadow-md data-[state=active]:bg-indigo-500 data-[state=active]:text-white p-2 md:p-3"
          >
            <span className="h-4 w-4 md:h-5 md:w-5">💬</span>
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="rounded-full bg-white dark:bg-gray-800 shadow-md data-[state=active]:bg-indigo-500 data-[state=active]:text-white p-2 md:p-3"
          >
            <span className="h-4 w-4 md:h-5 md:w-5">👥</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chats" className="flex-1 overflow-y-auto mt-0">
          <Chats searchTerm={searchTerm} onChatSelect={handleChatSelect} />
        </TabsContent>
        <TabsContent value="users" className="flex-1 overflow-y-auto">
          <AllUsers searchTerm={searchTerm} />
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="p-2 md:p-4 flex justify-around border-t border-border">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-indigo-100 dark:hover:bg-indigo-900 w-8 h-8 md:w-10 md:h-10"
          onClick={() => setIsGroupDialogOpen(true)}
        >
          <Users className="h-4 w-4 md:h-6 md:w-6 text-indigo-600 dark:text-indigo-400" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-indigo-100 dark:hover:bg-indigo-900 text-xs md:text-sm px-2 md:px-3 py-1 md:py-1.5"
          onClick={() => setIsSettingsDialogOpen(true)}
        >
          <Settings className="h-4 w-4 md:h-6 md:w-6 text-indigo-600 dark:text-indigo-400" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-red-100 dark:hover:bg-red-900 w-8 h-8 md:w-10 md:h-10"
          onClick={logout}
        >
          <LogOut className="h-4 w-4 md:h-6 md:w-6 text-red-600 dark:text-red-400" />
        </Button>
      </div>

      <NewGroupDialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen} currentUserUid={currentUser?.uid} />
      <UserSettingsDialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen} />
    </div>
  );
};

export default Sidebar;
