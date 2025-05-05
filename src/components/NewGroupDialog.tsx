
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { database, storage } from "@/lib/firebase.index";
import { ref, get, set, push } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Camera, RefreshCw } from "lucide-react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useMediaQuery } from "@/hooks/use-mobile";

interface User {
  id: string;
  displayName: string;
  photoURL: string | null;
  email: string;
  selected?: boolean;
}

interface NewGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserUid?: string;
}

const NewGroupDialog = ({ open, onOpenChange, currentUserUid }: NewGroupDialogProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState('');
  const [groupPhoto, setGroupPhoto] = useState<File | null>(null);
  const [groupPhotoPreview, setGroupPhotoPreview] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const containerRef = React.useRef(null);
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");

  useGSAP(() => {
    if (open) {
      // Enhanced dialog animation with mobile-specific tweaks
      const tl = gsap.timeline();
      tl.fromTo(
        ".dialog-content", 
        { 
          y: isMobile ? 50 : 20, 
          opacity: 0,
          scale: isMobile ? 0.95 : 0.98
        }, 
        { 
          y: 0, 
          opacity: 1, 
          scale: 1,
          duration: 0.45, 
          ease: "power2.out" 
        }
      );
      
      // Staggered animation for list items
      tl.fromTo(
        ".user-item",
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, stagger: 0.03, duration: 0.25, ease: "power1.out" },
        "-=0.2"
      );
    }
  }, [open, isMobile]);

  // Fetch all users except current user
  useEffect(() => {
    if (!open) return;
    
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);
        
        const usersList: User[] = [];
        snapshot.forEach(childSnapshot => {
          const userId = childSnapshot.key;
          const userData = childSnapshot.val();
          
          if (userId && userId !== currentUserUid) {
            usersList.push({
              id: userId,
              displayName: userData.displayName || 'Unknown User',
              photoURL: userData.photoURL,
              email: userData.email,
              selected: false
            });
          }
        });
        
        setUsers(usersList);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [open, currentUserUid]);
  
  // Handle photo file selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setGroupPhoto(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setGroupPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Toggle user selection
  const toggleUserSelection = (userId: string) => {
    const updatedUsers = users.map(user => {
      if (user.id === userId) {
        return { ...user, selected: !user.selected };
      }
      return user;
    });
    
    setUsers(updatedUsers);
    setSelectedUsers(updatedUsers.filter(u => u.selected));
  };
  
  // Create group
  const createGroup = async () => {
    if (!currentUserUid) {
      toast.error('You must be logged in');
      return;
    }
    
    if (groupName.trim() === '') {
      toast.error('Please enter a group name');
      return;
    }
    
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }
    
    try {
      setIsCreating(true);
      
      // Upload group photo if exists
      let photoURL = '';
      if (groupPhoto) {
        const groupPhotoRef = storageRef(storage, `group-photos/${Date.now()}_${groupPhoto.name}`);
        const uploadResult = await uploadBytes(groupPhotoRef, groupPhoto);
        photoURL = await getDownloadURL(uploadResult.ref);
      }
      
      // Create group chat in database
      const chatsRef = ref(database, 'chats');
      const newChatRef = push(chatsRef);
      
      // Include current user in the group
      const memberIds = selectedUsers.map(user => user.id);
      if (!memberIds.includes(currentUserUid)) {
        memberIds.push(currentUserUid);
      }
      
      await set(newChatRef, {
        type: 'group',
        groupName: groupName.trim(),
        groupPhoto: photoURL,
        users: memberIds,
        creator: currentUserUid,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      
      toast.success('Group created successfully!');
      onOpenChange(false);
      
      // Reset form
      setGroupName('');
      setGroupPhoto(null);
      setGroupPhotoPreview(null);
      setUsers(prevUsers => prevUsers.map(u => ({ ...u, selected: false })));
      setSelectedUsers([]);
      
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`dialog-content ${isMobile ? 'w-[95vw] p-3 max-h-[90vh]' : 'sm:max-w-md'}`} 
        ref={containerRef}
      >
        <DialogHeader className={isMobile ? 'space-y-1.5' : 'space-y-2'}>
          <DialogTitle>Create New Group</DialogTitle>
          <DialogDescription className={isMobile ? 'text-sm' : ''}>
            Create a group chat with your contacts
          </DialogDescription>
        </DialogHeader>

        <div className={`grid gap-4 ${isMobile ? 'py-3' : 'py-6'}`}>
          {/* Group Photo */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <Avatar className={isMobile ? 'h-16 w-16' : 'h-24 w-24'}>
                {groupPhotoPreview ? (
                  <AvatarImage src={groupPhotoPreview} />
                ) : (
                  <AvatarFallback className="bg-primary/20">
                    {groupName ? groupName.charAt(0).toUpperCase() : "G"}
                  </AvatarFallback>
                )}
                <label 
                  htmlFor="group-photo-input" 
                  className={`absolute bottom-0 right-0 bg-primary text-white 
                             ${isMobile ? 'p-1' : 'p-1.5'} rounded-full cursor-pointer 
                             hover:bg-primary/80 transition-colors duration-200 shadow-sm`}
                >
                  <Camera className={isMobile ? 'h-3 w-3' : 'h-4 w-4'} />
                </label>
                <input 
                  id="group-photo-input" 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoSelect}
                  className="hidden" 
                />
              </Avatar>
            </div>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
              Group Photo (optional)
            </p>
          </div>

          {/* Group Name Input */}
          <div>
            <label htmlFor="group-name" className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium mb-1 block`}>
              Group Name
            </label>
            <Input 
              id="group-name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              className={isMobile ? 'text-sm h-9' : ''}
            />
          </div>

          {/* User Selection */}
          <div>
            <label className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium mb-1 block`}>
              Add Members ({selectedUsers.length} selected)
            </label>
            
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <RefreshCw className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} animate-spin text-muted-foreground`} />
              </div>
            ) : (
              <ScrollArea className={`${isMobile ? 'h-44' : 'h-60'} border rounded-md`}>
                <div className="p-2 space-y-1.5">
                  {users.length === 0 ? (
                    <p className="text-center text-muted-foreground p-4">
                      No users found
                    </p>
                  ) : (
                    users.map((user) => (
                      <div 
                        key={user.id}
                        className={`flex items-center p-2 rounded-lg user-item ${user.selected ? 'bg-primary/10' : 'hover:bg-muted/50'}`}
                      >
                        <Checkbox 
                          id={`user-${user.id}`}
                          checked={user.selected}
                          onCheckedChange={() => toggleUserSelection(user.id)}
                          className={`mr-2 ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`}
                        />
                        <Avatar className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} mr-3`}>
                          <AvatarImage src={user.photoURL || undefined} />
                          <AvatarFallback>
                            {user.displayName?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <label 
                          htmlFor={`user-${user.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          <div className={`font-medium ${isMobile ? 'text-sm' : ''}`}>
                            {user.displayName}
                          </div>
                          <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                            {user.email}
                          </div>
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        <DialogFooter className={isMobile ? 'flex-col gap-2' : undefined}>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className={isMobile ? 'w-full' : ''}
            size={isMobile ? "sm" : "default"}
          >
            Cancel
          </Button>
          <Button 
            onClick={createGroup} 
            disabled={isCreating || groupName.trim() === '' || selectedUsers.length === 0}
            className={isMobile ? 'w-full' : ''}
            size={isMobile ? "sm" : "default"}
          >
            {isCreating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Group'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewGroupDialog;
