import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Toaster } from "sonner";
import PrivateRoute from "@/routes/PrivateRoute";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import AppLayout from "@/pages/Index";

function App() {
  console.log('App component rendered'); // Debug log

  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <ChatProvider>

            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Home />
                  </PrivateRoute>
                }
              />
              <Route
                path="/chat"
                element={
                  <PrivateRoute>
                    <AppLayout />
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
            <Toaster position="top-right" />

          </ChatProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;