
import { useEffect, useState, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { MessageCircle, Menu } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

const AppLayout = () => {
  const { currentUser, loading } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const containerRef = useRef(null);

  console.log('AppLayout rendered:', { currentUser, loading, isMobile, sidebarOpen, pathname: location.pathname });

  // GSAP animations
  useGSAP(() => {
    gsap.fromTo(
      containerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: "power2.out" }
    );
  }, []);

  useEffect(() => {
    // Update favicon
    const linkElement = document.querySelector('link[rel="icon"]');
    if (linkElement instanceof HTMLLinkElement) {
      linkElement.href = '/logo.svg';
    } else {
      const newLink = document.createElement('link');
      newLink.rel = 'icon';
      newLink.href = '/logo.svg';
      document.head.appendChild(newLink);
    }
  }, []);

  useEffect(() => {
    if (!isMobile) setSidebarOpen(false);
  }, [isMobile]);
  
  // Toggle sidebar function (for mobile menu button)
  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-indigo-600 border-gray-200 dark:border-gray-700 dark:border-t-indigo-400"></div>
      </div>
    );
  }

  if (!currentUser) {
    console.log('AppLayout: No currentUser, navigating to /login');
    return <Navigate to="/login" replace />;
  }

  return (
    <ChatProvider>
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900 dark:to-purple-900" ref={containerRef}>
        {/* Mobile Hamburger Menu Button */}
        {isMobile && (
          <button 
            onClick={toggleSidebar}
            className="fixed top-4 left-4 bg-indigo-600 text-white p-2 rounded-full shadow-md z-50 md:hidden"
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
        )}
        
        {/* Desktop Sidebar */}
        {!isMobile && (
          <aside className="hidden lg:block w-[280px] xl:w-[350px] border-r border-indigo-100 dark:border-indigo-800/50">
            <Sidebar />
          </aside>
        )}

        {/* Mobile Navigation */}
        {isMobile && (
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent
              side="left"
              className="w-[85vw] max-w-[300px] p-0 bg-white/90 dark:bg-indigo-950/95 backdrop-blur-lg"
            >
              <Sidebar onNavigate={() => setSidebarOpen(false)} />
            </SheetContent>
          </Sheet>
        )}

        {/* Main Chat Area */}
        <main className="flex-1 relative overflow-hidden">
          <ChatWindow onToggleSidebar={toggleSidebar} />

          {/* Background Effects */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
            <div className="absolute top-10 left-10 w-40 h-40 bg-indigo-300 dark:bg-indigo-700 rounded-full opacity-20 animate-float"></div>
            <div className="absolute bottom-20 right-20 w-60 h-60 bg-purple-300 dark:bg-purple-700 rounded-full opacity-20 animate-float-delayed"></div>
          </div>
        </main>
      </div>
    </ChatProvider>
  );
};

export default AppLayout;
