import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Phone, Video, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { toast } from "sonner";

const Home = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!currentUser) {
            console.log('No current user, navigating to /login');
            navigate("/login");
            return;
        }
    }, [currentUser, navigate]);

    const handleStartChatting = () => {
        console.log('Start Chatting button clicked, navigating to /chat');
        toast.success('Navigating to chat');
        navigate("/chat");
    };

    if (!currentUser) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800">
            {/* Hero Section */}
            <div className="container mx-auto px-4 py-16">
                <div className="flex flex-col items-center text-center">
                    <Avatar className="h-24 w-24 mb-6">
                        <AvatarImage
                            src={currentUser.photoURL || undefined}
                            alt={currentUser.displayName || "User"}
                        />
                        <AvatarFallback className="bg-indigo-500 text-white text-2xl">
                            {currentUser.displayName?.charAt(0) || "U"}
                        </AvatarFallback>
                    </Avatar>

                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        Welcome, {currentUser.displayName || "User"}!
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                        Start connecting with your friends
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl w-full">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900 mb-4 mx-auto">
                                <MessageSquare className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Chat
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Send messages to your friends in real-time
                            </p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900 mb-4 mx-auto">
                                <Phone className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Voice Calls
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Make crystal clear voice calls
                            </p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900 mb-4 mx-auto">
                                <Video className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Video Calls
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Connect face-to-face with video calls
                            </p>
                        </div>
                    </div>

                    <div className="mt-12">
                        <Button
                            size="lg"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            onClick={handleStartChatting}
                        >
                            Start Chatting
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;