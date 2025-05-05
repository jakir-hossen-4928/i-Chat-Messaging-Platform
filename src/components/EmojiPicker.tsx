
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile } from "lucide-react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { useIsMobile } from "@/hooks/use-mobile";

interface EmojiPickerProps {
    onSelect: (emoji: string) => void;
}

const EmojiPicker = ({ onSelect }: EmojiPickerProps) => {
    const [open, setOpen] = useState(false);
    const isMobile = useIsMobile();

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:bg-transparent hover:text-foreground transition-colors"
                >
                    <Smile className="h-5 w-5" />
                    <span className="sr-only">Emoji picker</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent 
                className="w-auto p-0" 
                align="end"
                side={isMobile ? "top" : "right"}
                sideOffset={isMobile ? 40 : 5}
                alignOffset={isMobile ? -20 : 0}
            >
                <Picker
                    data={data}
                    onEmojiSelect={(emoji: any) => {
                        onSelect(emoji.native);
                        setOpen(false);
                    }}
                    theme="light"
                    previewPosition="none"
                    searchPosition={isMobile ? "none" : "top"}
                    skinTonePosition="none"
                    set="native"
                    perLine={isMobile ? 7 : 9}
                    maxFrequentRows={isMobile ? 1 : 4}
                />
            </PopoverContent>
        </Popover>
    );
};

export default EmojiPicker;
