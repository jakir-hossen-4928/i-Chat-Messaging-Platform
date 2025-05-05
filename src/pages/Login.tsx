import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { toast } from "sonner";

const Login = () => {
  const { loginWithGoogle, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (currentUser) {
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [currentUser, navigate, location]);

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
     
    } catch (error) {
      toast.error("Failed to login. Please try again.", {
        position: "top-center",
        duration: 3000,
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 transition-colors duration-300">
      <div className="max-w-md w-full mx-4 p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl transform transition-all duration-300 hover:shadow-2xl">
        <div className="text-center mb-8">
          <img
            src="/logo.svg"
            alt="i-Chat Logo"
            className="mx-auto mb-4 w-24 h-24 animate-pulse"
            style={{ animationDuration: "2s" }}
          />
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
            Welcome to i-Chat
          </h1>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            Connect with friends through seamless chat, voice, and video calls
          </p>
        </div>

        <div className="space-y-6">
          <Button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-700"
            aria-label="Login with Google"
          >
            <img
              src="https://img.icons8.com/color/48/google-logo.png"
              alt="Google Icon"
              className="w-6 h-6"
            />
            Continue with Google
          </Button>
        </div>

        <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            By continuing, you agree to our{" "}
            <a
              href="/terms"
              className="underline hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              className="underline hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;