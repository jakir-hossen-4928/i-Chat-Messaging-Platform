
import React from "react";
import { X, Mail, Phone, MapPin, Calendar, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface UserProfileViewProps {
  user: {
    uid: string;
    displayName: string;
    email: string | null;
    photoURL?: string;
    status?: "online" | "offline";
    bio?: string;
    lastSeen?: number;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

const UserProfileView: React.FC<UserProfileViewProps> = ({ user, isOpen, onClose }) => {
  if (!user || !isOpen) return null;

  const formatLastSeen = (timestamp?: number) => {
    if (!timestamp) return "Unknown";
    return format(new Date(timestamp), "PPpp");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="bg-gradient-to-br from-white/80 to-white/95 dark:from-gray-900/90 dark:to-gray-800/95 
                   rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-2 right-2 rounded-full z-10 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <X className="h-5 w-5" />
        </Button>
        
        {/* Profile header with gradient background */}
        <div className="relative">
          <div className="h-28 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
          <div className="absolute -bottom-16 left-0 w-full flex justify-center">
            <div className="ring-4 ring-white dark:ring-gray-900 rounded-full overflow-hidden">
              <Avatar className="w-32 h-32 border-4 border-white dark:border-gray-900">
                <AvatarImage src={user.photoURL} alt={user.displayName} />
                <AvatarFallback className="text-3xl font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-200">
                  {user.displayName?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
        
        {/* Profile content */}
        <div className="pt-20 pb-6 px-6">
          {/* Name and status */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user.displayName}</h2>
            <div className="flex items-center justify-center mt-2">
              <Badge 
                variant="outline" 
                className={cn(
                  "px-2 py-0.5 text-xs font-medium rounded-full flex items-center gap-1.5",
                  user.status === "online" 
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" 
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                )}
              >
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  user.status === "online" ? "bg-green-500" : "bg-gray-400"
                )} />
                {user.status === "online" ? "Online" : "Offline"}
              </Badge>
            </div>
          </div>
          
          {/* Bio */}
          {user.bio && (
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-300 text-center italic">"{user.bio}"</p>
            </div>
          )}
          
          {/* Contact info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="bg-indigo-100 dark:bg-indigo-800/40 p-2 rounded-full">
                <Mail className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
              </div>
              <span className="text-gray-600 dark:text-gray-300">{user.email || "No email provided"}</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="bg-indigo-100 dark:bg-indigo-800/40 p-2 rounded-full">
                <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
              </div>
              <span className="text-gray-600 dark:text-gray-300">
                Last seen: {formatLastSeen(user.lastSeen)}
              </span>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="mt-8 flex gap-3">
            <Button 
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
              onClick={() => onClose()}
            >
              Message
            </Button>
            <Button
              variant="outline"
              className="flex-1 border border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-900/30"
              onClick={() => onClose()}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileView;
