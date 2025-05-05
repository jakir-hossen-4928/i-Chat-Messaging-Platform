
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Message } from "@/lib/types";
import { useChat } from "@/contexts/ChatContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface MessageEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  message: Message;
}

const MessageEditDialog: React.FC<MessageEditDialogProps> = ({
  isOpen,
  onClose,
  message
}) => {
  const [editedText, setEditedText] = useState(message.text);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { editMessage } = useChat();

  const handleSubmit = async () => {
    if (editedText.trim() === message.text) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      await editMessage(message.id, editedText);
      toast.success("Message updated");
      onClose();
    } catch (error) {
      console.error("Failed to edit message:", error);
      toast.error("Failed to update message");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Message</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-2">
          <Textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            placeholder="Edit your message..."
            className="min-h-[120px]"
            autoFocus
          />
          
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex items-center gap-2 rounded-md bg-muted/30 p-2">
              {message.attachments[0].type === 'image' && (
                <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                  <img 
                    src={message.attachments[0].url} 
                    alt="Attachment"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Image attachments cannot be edited
              </p>
            </div>
          )}
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || !editedText.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessageEditDialog;
