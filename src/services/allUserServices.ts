import { getDatabase, ref, get, set, remove } from 'firebase/database';
import { app } from '@/lib/firebase';
import { toast } from 'sonner';
import { User } from '@/lib/types';

export const createUser = async (user: User): Promise<void> => {
  try {
    const db = getDatabase(app);
    const userRef = ref(db, `users/${user.uid}`);

    // Validate required fields
    if (!user.uid || !user.displayName || !user.email) {
      throw new Error('Missing required user fields');
    }

    const userData = {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL || null,
      status: 'online',
      lastSeen: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await set(userRef, userData);
  } catch (error) {
    console.error('Error creating user:', error);
    toast.error('Failed to create user');
    throw error;
  }
};

export const deleteUser = async (userId: string): Promise<void> => {
  try {
    const db = getDatabase(app);
    const userRef = ref(db, `users/${userId}`);
    await remove(userRef);
  } catch (error) {
    console.error('Error deleting user:', error);
    toast.error('Failed to delete user');
    throw error;
  }
};

export const getAllUsers = async (currentUserId: string): Promise<User[]> => {
  try {
    const db = getDatabase(app);
    const [usersSnapshot, friendsSnapshot] = await Promise.all([
      get(ref(db, 'users')),
      get(ref(db, `friendships/${currentUserId}`))
    ]);

    if (!usersSnapshot.exists()) {
      return [];
    }

    const usersData = usersSnapshot.val();
    const friendsData = friendsSnapshot.exists() ? friendsSnapshot.val() : {};
    const friendsList = Object.keys(friendsData);

    const users: User[] = [];

    Object.entries(usersData).forEach(([uid, userData]: [string, any]) => {
      // Skip the current user and friends
      if (uid === currentUserId || friendsList.includes(uid)) return;

      // Skip incomplete user data
      if (!userData.displayName || !userData.email) return;

      users.push({
        uid,
        displayName: userData.displayName,
        email: userData.email,
        photoURL: userData.photoURL,
        status: userData.status || 'offline',
        lastSeen: userData.lastSeen,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      });
    });

    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    toast.error('Failed to fetch users');
    throw error;
  }
};

export const updateUserStatus = async (userId: string, status: 'online' | 'offline'): Promise<void> => {
  try {
    const db = getDatabase(app);
    const userRef = ref(db, `users/${userId}`);

    const currentData = await get(userRef);
    if (!currentData.exists()) {
      throw new Error('User not found');
    }

    await set(userRef, {
      ...currentData.val(),
      status,
      lastSeen: Date.now(),
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    toast.error('Failed to update user status');
    throw error;
  }
};

export const updateUserProfile = async (userId: string, data: Partial<User>): Promise<void> => {
  try {
    const db = getDatabase(app);
    const userRef = ref(db, `users/${userId}`);

    const currentData = await get(userRef);
    if (!currentData.exists()) {
      throw new Error('User not found');
    }

    // Validate required fields
    if (data.displayName === '' || data.email === '') {
      throw new Error('Display name and email cannot be empty');
    }

    await set(userRef, {
      ...currentData.val(),
      ...data,
      updatedAt: Date.now()
    });

    toast.success('Profile updated successfully');
  } catch (error) {
    console.error('Error updating user profile:', error);
    toast.error('Failed to update profile');
    throw error;
  }
};
