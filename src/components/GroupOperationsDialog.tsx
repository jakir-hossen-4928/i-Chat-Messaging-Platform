
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { database } from "@/lib/firebase.index";
import { ref, get, update, remove } from "firebase/database";
import { toast } from "sonner";
import { UserPlus, UserMinus, UserX, Users, Settings, Trash2 } from "lucide-react";

interface GroupOperationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatId: string;
  onLeaveGroup: () => Promise<void>;
}

const GroupOperationsDialog: React.FC<GroupOperationsDialogProps> = ({
  open,
  onOpenChange,
  chatId,
  onLeaveGroup,
}) => {
  const { currentUser } = useAuth();
  const [isCreator, setIsCreator] = useState(false);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [nonMembers, setNonMembers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Debug log
  console.debug("GroupOperationsDialog rendered:", { chatId });

  // Fetch group data to check if current user is the creator
  useEffect(() => {
    if (!open || !currentUser || !chatId) return;

    const fetchGroupData = async () => {
      setIsLoading(true);
      try {
        const groupRef = ref(database, `chats/${chatId}`);
        const groupSnapshot = await get(groupRef);
        
        if (groupSnapshot.exists()) {
          const groupData = groupSnapshot.val();
          setIsCreator(groupData.creator === currentUser.uid);
          
          // Fetch current members
          const memberPromises = groupData.users.map(async (userId: string) => {
            const userRef = ref(database, `users/${userId}`);
            const userSnapshot = await get(userRef);
            if (userSnapshot.exists()) {
              const userData = userSnapshot.val();
              return {
                uid: userId,
                displayName: userData.displayName || "User",
                photoURL: userData.photoURL || "",
                email: userData.email || "",
              };
            }
            return null;
          });
          
          const resolvedMembers = await Promise.all(memberPromises);
          setGroupMembers(resolvedMembers.filter(Boolean));
          
          // Fetch all users who are not in the group
          if (isCreator) {
            const allUsersRef = ref(database, "users");
            const allUsersSnapshot = await get(allUsersRef);
            
            if (allUsersSnapshot.exists()) {
              const allUsers: any[] = [];
              allUsersSnapshot.forEach((childSnapshot) => {
                const userId = childSnapshot.key;
                const userData = childSnapshot.val();
                
                if (!groupData.users.includes(userId)) {
                  allUsers.push({
                    uid: userId,
                    displayName: userData.displayName || "User",
                    photoURL: userData.photoURL || "",
                    email: userData.email || "",
                  });
                }
              });
              
              setNonMembers(allUsers);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching group data:", error);
        toast.error("Failed to load group information");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchGroupData();
  }, [open, currentUser, chatId, isCreator]);

  // Add a user to the group
  const handleAddMember = async (userId: string) => {
    if (!isCreator || !currentUser) return;
    
    try {
      // Get current group data
      const groupRef = ref(database, `chats/${chatId}`);
      const groupSnapshot = await get(groupRef);
      
      if (groupSnapshot.exists()) {
        const groupData = groupSnapshot.val();
        const updatedUsers = [...groupData.users, userId];
        
        // Update the group with new member
        await update(ref(database, `chats/${chatId}`), {
          users: updatedUsers,
          updatedAt: Date.now()
        });
        
        // Update local state
        const userRef = ref(database, `users/${userId}`);
        const userSnapshot = await get(userRef);
        
        if (userSnapshot.exists()) {
          const userData = userSnapshot.val();
          const newMember = {
            uid: userId,
            displayName: userData.displayName || "User",
            photoURL: userData.photoURL || "",
            email: userData.email || ""
          };
          
          setGroupMembers([...groupMembers, newMember]);
          setNonMembers(nonMembers.filter(user => user.uid !== userId));
        }
        
        toast.success("Member added to group");
      }
    } catch (error) {
      console.error("Error adding member:", error);
      toast.error("Failed to add member");
    }
  };

  // Remove a user from the group
  const handleRemoveMember = async (userId: string) => {
    if (!isCreator || !currentUser || userId === currentUser.uid) return;
    
    try {
      // Get current group data
      const groupRef = ref(database, `chats/${chatId}`);
      const groupSnapshot = await get(groupRef);
      
      if (groupSnapshot.exists()) {
        const groupData = groupSnapshot.val();
        const updatedUsers = groupData.users.filter((id: string) => id !== userId);
        
        // Update group with removed member
        await update(ref(database, `chats/${chatId}`), {
          users: updatedUsers,
          updatedAt: Date.now()
        });
        
        // Update local state
        const removedMember = groupMembers.find(member => member.uid === userId);
        setGroupMembers(groupMembers.filter(member => member.uid !== userId));
        
        if (removedMember) {
          setNonMembers([...nonMembers, removedMember]);
        }
        
        toast.success("Member removed from group");
      }
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove member");
    }
  };

  // Delete the group entirely
  const handleDeleteGroup = async () => {
    if (!isCreator || !currentUser) return;
    
    try {
      // Delete the entire group
      await remove(ref(database, `chats/${chatId}`));
      onOpenChange(false);
      toast.success("Group deleted successfully");
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error("Failed to delete group");
    }
  };

  // Filter users based on search term
  const filteredNonMembers = nonMembers.filter(user => 
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Group Settings</DialogTitle>
          <DialogDescription>
            Manage group members and settings
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="members" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="members">Members</TabsTrigger>
            {isCreator && <TabsTrigger value="add">Add Members</TabsTrigger>}
          </TabsList>

          <TabsContent value="members" className="mt-4">
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {groupMembers.map((member) => (
                  <div key={member.uid} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.photoURL} />
                        <AvatarFallback>{member.displayName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{member.displayName}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                      {member.uid === currentUser?.uid && (
                        <span className="text-xs text-primary ml-2">(You)</span>
                      )}
                    </div>
                    
                    {isCreator && member.uid !== currentUser?.uid && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive"
                        onClick={() => handleRemoveMember(member.uid)}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="mt-4 pt-4 border-t flex justify-between">
              <Button variant="outline" onClick={onLeaveGroup}>
                Leave Group
              </Button>
              
              {isCreator && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="text-xs"
                  onClick={handleDeleteGroup}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete Group
                </Button>
              )}
            </div>
          </TabsContent>

          {isCreator && (
            <TabsContent value="add" className="mt-4">
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-4"
              />
              
              <ScrollArea className="h-[300px] pr-4">
                {filteredNonMembers.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No users found
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredNonMembers.map((user) => (
                      <div key={user.uid} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.photoURL} />
                            <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{user.displayName}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-primary"
                          onClick={() => handleAddMember(user.uid)}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default GroupOperationsDialog;
