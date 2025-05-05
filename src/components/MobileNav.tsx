
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, MessageSquare, UserPlus, Bell, Settings, Menu } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";
import { cn } from "@/lib/utils";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

interface MobileNavProps {
  setActiveTab: (tab: string) => void;
  activeTab: string;
  pendingRequestsCount: number;
  onToggleSidebar: () => void;
}

const MobileNav = ({ setActiveTab, activeTab, pendingRequestsCount, onToggleSidebar }: MobileNavProps) => {
  const { state } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef(null);
  
  useGSAP(() => {
    // Create smoother animations for the navigation items
    gsap.fromTo(
      ".nav-item", 
      { opacity: 0, x: -20 }, 
      { opacity: 1, x: 0, stagger: 0.08, duration: 0.4, ease: "power2.out" }
    );
    
    // Animate the drawer in/out based on isOpen state
    if (navRef.current) {
      const tl = gsap.timeline();
      if (isOpen) {
        tl.to(navRef.current, {
          x: 0,
          duration: 0.4,
          ease: "power3.out",
          clearProps: "transform" // Clear transform props after animation completes
        });
      }
    }
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      onToggleSidebar();
    }
  };
  
  return (
    <>
      {/* Mobile Nav Trigger with improved animation */}
      <button 
        onClick={handleToggle}
        className="fixed left-0 top-1/4 bg-indigo-600 text-white p-2 rounded-r-lg shadow-md z-50 md:hidden 
                   transition-transform duration-300 hover:scale-105 active:scale-95"
      >
        {isOpen ? <ChevronLeft className="transition-transform duration-200" /> : <ChevronRight className="transition-transform duration-200" />}
      </button>
      
      {/* Mobile Hamburger Menu Button with animation */}
      <button 
        onClick={onToggleSidebar}
        className="fixed top-4 left-4 bg-indigo-600 text-white p-2 rounded-full shadow-md z-50 md:hidden
                   transition-all duration-300 hover:bg-indigo-700 active:scale-95"
        aria-label="Toggle sidebar"
      >
        <Menu size={20} />
      </button>
      
      {/* Mobile Navigation Drawer with improved animation */}
      <div 
        ref={navRef}
        className={cn(
          "fixed inset-y-0 left-0 w-16 bg-indigo-700 text-white flex flex-col items-center py-4 z-40 transition-transform duration-300 md:hidden shadow-lg",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex-1 flex flex-col items-center space-y-8 mt-16">
          <button 
            onClick={() => {
              setActiveTab("chats");
              setIsOpen(false);
            }}
            className={cn(
              "p-3 rounded-full relative nav-item transition-all duration-200",
              activeTab === "chats" ? "bg-indigo-800 shadow-md" : "hover:bg-indigo-600"
            )}
          >
            <MessageSquare size={24} className={activeTab === "chats" ? "text-white" : "text-indigo-100"} />
            <span className="sr-only">Chats</span>
          </button>
          
          <button 
            onClick={() => {
              setActiveTab("contacts");
              setIsOpen(false);
            }}
            className={cn(
              "p-3 rounded-full relative nav-item transition-all duration-200",
              activeTab === "contacts" ? "bg-indigo-800 shadow-md" : "hover:bg-indigo-600"
            )}
          >
            <UserPlus size={24} className={activeTab === "contacts" ? "text-white" : "text-indigo-100"} />
            <span className="sr-only">Contacts</span>
          </button>
          
          <button 
            onClick={() => {
              setActiveTab("requests");
              setIsOpen(false);
            }}
            className={cn(
              "p-3 rounded-full relative nav-item transition-all duration-200", 
              activeTab === "requests" ? "bg-indigo-800 shadow-md" : "hover:bg-indigo-600" 
            )}
          >
            <Bell size={24} className={activeTab === "requests" ? "text-white" : "text-indigo-100"} />
            {pendingRequestsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full animate-pulse">
                {pendingRequestsCount}
              </span>
            )}
            <span className="sr-only">Requests</span>
          </button>
          
          <button 
            className="p-3 rounded-full nav-item hover:bg-indigo-600 transition-all duration-200"
          >
            <Settings size={24} className="text-indigo-100" />
            <span className="sr-only">Settings</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default MobileNav;
