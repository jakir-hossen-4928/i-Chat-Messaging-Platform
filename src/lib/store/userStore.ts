import { atom } from 'jotai';
import { User } from '@/lib/types';

export const userAtom = atom<User | null>(null);
export const loadingAtom = atom<boolean>(true);

// Derived atoms
export const isAuthenticatedAtom = atom((get) => {
  const user = get(userAtom);
  return user !== null;
});

export const userDisplayNameAtom = atom((get) => {
  const user = get(userAtom);
  return user?.displayName || '';
});

export const userEmailAtom = atom((get) => {
  const user = get(userAtom);
  return user?.email || '';
});

export const userPhotoURLAtom = atom((get) => {
  const user = get(userAtom);
  return user?.photoURL || null;
});

export const userStatusAtom = atom((get) => {
  const user = get(userAtom);
  return user?.status || 'offline';
});