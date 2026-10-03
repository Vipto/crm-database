import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  switchRole: (role: UserRole) => void;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name: string, role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isManager: boolean;
  isEmployee: boolean;
  canManageEmployees: boolean;
  canDeleteSellers: boolean;
  canBulkAssign: boolean;
  canImportSellers: boolean;
}

const DEFAULT_ADMIN_USER: UserProfile = {
  uid: 'admin-vipto',
  email: 'admin@vipto.in',
  displayName: 'Vipto',
  role: 'admin',
  assignedLocation: 'National / HQ',
  assignedCategories: ['Fashion', 'Electronics', 'Footwear', 'Jewelry'],
  isActive: true,
};

const DEMO_USERS: Record<UserRole, UserProfile> = {
  admin: {
    uid: 'admin-vipto',
    email: 'admin@vipto.in',
    displayName: 'Vipto',
    role: 'admin',
    assignedLocation: 'National / HQ',
    assignedCategories: ['Fashion', 'Electronics', 'Footwear', 'Jewelry'],
    isActive: true,
  },
  manager: {
    uid: 'manager-vipto',
    email: 'manager@vipto.in',
    displayName: 'Vipto Manager',
    role: 'manager',
    assignedLocation: 'Pune',
    assignedCategories: ['Fashion', 'Footwear', 'Handicrafts'],
    isActive: true,
  },
  employee: {
    uid: 'team-vipto',
    email: 'team@vipto.in',
    displayName: 'Vipto Team',
    role: 'employee',
    assignedLocation: 'Pune',
    assignedCategories: ['Jewelry', 'Apparel', 'Textiles'],
    isActive: true,
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(DEFAULT_ADMIN_USER);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            setCurrentUser({ uid: user.uid, ...snap.data() } as UserProfile);
          } else {
            // New user default
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || 'user@vipto.in',
              displayName: user.displayName || user.email?.split('@')[0] || 'Vipto Member',
              role: 'admin',
              isActive: true,
            };
            await setDoc(userDocRef, { ...newProfile, createdAt: serverTimestamp() });
            setCurrentUser(newProfile);
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
          setCurrentUser(DEFAULT_ADMIN_USER);
        }
      } else {
        // Default to admin mode for instant exploration and production demo
        setCurrentUser(DEFAULT_ADMIN_USER);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const switchRole = (role: UserRole) => {
    const demoProfile = DEMO_USERS[role];
    setCurrentUser(demoProfile);
  };

  const signIn = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUp = async (email: string, pass: string, name: string, role: UserRole) => {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    const user = res.user;
    const profile: UserProfile = {
      uid: user.uid,
      email: email,
      displayName: name,
      role: role,
      isActive: true,
    };
    await setDoc(doc(db, 'users', user.uid), { ...profile, createdAt: serverTimestamp() });
    setCurrentUser(profile);
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch {
      // Ignore
    }
    setCurrentUser(DEFAULT_ADMIN_USER);
  };

  const role = currentUser?.role || 'admin';
  const isAdmin = role === 'admin';
  const isManager = role === 'manager';
  const isEmployee = role === 'employee';

  const canManageEmployees = isAdmin;
  const canDeleteSellers = isAdmin;
  const canBulkAssign = isAdmin || isManager;
  const canImportSellers = isAdmin;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        loading,
        switchRole,
        signIn,
        signUp,
        signOut,
        isAdmin,
        isManager,
        isEmployee,
        canManageEmployees,
        canDeleteSellers,
        canBulkAssign,
        canImportSellers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
