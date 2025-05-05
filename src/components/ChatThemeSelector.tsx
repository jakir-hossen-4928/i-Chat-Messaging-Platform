
import React from "react";
import { useTheme } from "@/components/theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Check, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

const themes = [
  {
    id: "default",
    name: "Default",
    description: "Standard chat interface",
    preview: "bg-gradient-to-br from-primary/5 to-primary/10",
  },
  {
    id: "bubble",
    name: "Bubble",
    description: "Rounded bubble style",
    preview: "bg-gradient-to-br from-blue-500/10 to-indigo-500/20",
  },
  {
    id: "elegant",
    name: "Elegant",
    description: "Sleek minimalist design",
    preview: "bg-gradient-to-br from-gray-500/10 to-gray-700/20",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean simple interface",
    preview: "bg-gradient-to-br from-green-400/10 to-teal-500/20",
  }
];

export default function ChatThemeSelector() {
  const { chatTheme, setChatTheme } = useTheme();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
          <Palette className="h-5 w-5" />
          <span className="sr-only">Change chat theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="p-2">
        <div className="mb-2 px-2 text-xs font-semibold">Chat Themes</div>
        <div className="grid grid-cols-2 gap-2 p-2">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setChatTheme(theme.id as any)}
              className={cn(
                "relative flex h-16 w-full flex-col justify-between rounded-md p-2",
                theme.preview
              )}
            >
              <div className="flex justify-between">
                <span className="text-xs font-bold">{theme.name}</span>
                {chatTheme === theme.id && (
                  <Check className="h-4 w-4" />
                )}
              </div>
              <span className="text-[10px] text-left opacity-80">
                {theme.description}
              </span>
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
