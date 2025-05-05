
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, database } from '@/lib/firebase.index';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { ref, get, set, update, onDisconnect } from 'firebase/database';
import { toast } from 'sonner';
import { User, AuthContextType } from '@/lib/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Update user's online status
  useEffect(() => {
    if (!currentUser) return;

    const userStatusRef = ref(database, `users/${currentUser.uid}/status`);
    const userLastSeenRef = ref(database, `users/${currentUser.uid}/lastSeen`);

    // Set status to online
    update(ref(database, `users/${currentUser.uid}`), {
      status: 'online',
      lastSeen: Date.now()
    });

    // Set user as offline when disconnected
    onDisconnect(userStatusRef).set('offline');
    onDisconnect(userLastSeenRef).set(Date.now());

    return () => {
      // Cleanup the onDisconnect handlers
      update(ref(database, `users/${currentUser.uid}`), {
        status: 'offline',
        lastSeen: Date.now()
      });
    };
  }, [currentUser]);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setLoading(true);

      if (firebaseUser) {
        try {
          // Check if user exists in database
          const userRef = ref(database, `users/${firebaseUser.uid}`);
          const snapshot = await get(userRef);

          let userData: User;

          if (snapshot.exists()) {
            // Update existing user
            userData = snapshot.val() as User;
            await update(userRef, {
              status: 'online',
              lastSeen: Date.now(),
              updatedAt: Date.now()
            });
          } else {
            // Create new user
            userData = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'User',
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL || '',
              status: 'online',
              lastSeen: Date.now(),
              createdAt: Date.now(),
              updatedAt: Date.now()
            };
            await set(userRef, userData);
          }

          setCurrentUser(userData);
        } catch (error) {
          console.error('Error setting up user:', error);
          toast.error('Failed to initialize user profile');
        }
      } else {
        setCurrentUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Google Login
  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      if (result.user) {
        const user = result.user;
        
        // Update or create user in database
        const userRef = ref(database, `users/${user.uid}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
          // Update existing user
          await update(userRef, {
            displayName: user.displayName || 'User',
            photoURL: user.photoURL || '',
            email: user.email,
            status: 'online',
            lastSeen: Date.now(),
            updatedAt: Date.now()
          });
        } else {
          // Create new user
          const newUser: User = {
            uid: user.uid,
            displayName: user.displayName || 'User',
            email: user.email,
            photoURL: user.photoURL || '',
            status: 'online',
            lastSeen: Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          await set(userRef, newUser);
        }
        
        navigate('/');
        toast.success('Logged in successfully!');
      }
    } catch (error) {
      console.error('Error logging in with Google:', error);
      toast.error('Failed to login with Google');
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      if (currentUser) {
        // Update user status to offline
        await update(ref(database, `users/${currentUser.uid}`), {
          status: 'offline',
          lastSeen: Date.now()
        });
      }
      
      await signOut(auth);
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to logout');
    }
  };

  // Update user profile
  const updateUserProfile = async (data: Partial<User>) => {
    if (!currentUser) return;
    
    try {
      const userRef = ref(database, `users/${currentUser.uid}`);
      await update(userRef, {
        ...data,
        updatedAt: Date.now()
      });
      
      setCurrentUser(prev => prev ? { ...prev, ...data } : null);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const value = {
    currentUser,
    loading,
    loginWithGoogle,
    logout,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
