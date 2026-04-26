import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut, 
  GoogleAuthProvider, 
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isContributor: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithPhone: (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => Promise<ConfirmationResult>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isContributor, setIsContributor] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Fetch or create profile
        const profileRef = doc(db, 'users', user.uid);
        const adminRef = doc(db, 'admins', user.uid);
        
        const [profileSnap, adminSnap] = await Promise.all([
          getDoc(profileRef),
          getDoc(adminRef)
        ]);

        setIsAdmin(adminSnap.exists() || user.email === 'aminuarogo@gmail.com');
        
        const currentProfile = profileSnap.data() as UserProfile;
        if (profileSnap.exists()) {
          setProfile(currentProfile);
          setIsContributor(currentProfile.role === 'contributor' || adminSnap.exists() || user.email === 'aminuarogo@gmail.com');
        } else {
          // Initialize new identity
          const newProfile: UserProfile = {
            uid: user.uid,
            displayName: user.displayName || 'Anonymous Citizen',
            email: user.email || '',
            statusTier: 'Citizen',
            role: 'citizen',
            xp: 0,
            identities: []
          };
          await setDoc(profileRef, { 
            ...newProfile, 
            createdAt: serverTimestamp(), 
            updatedAt: serverTimestamp() 
          });
          setProfile({ ...newProfile, createdAt: new Date(), updatedAt: new Date() });
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // Ensure we don't have multiple popups
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        console.warn("Sovereign Protocol: Identity sync cancelled by user.");
      } else if (error.code === 'auth/cancelled-popup-request') {
        console.warn("Sovereign Protocol: Multiple identity sync requests detected.");
      } else {
        console.error("Sovereign Protocol: Identity sync terminal failure.", error);
      }
      throw error;
    }
  };

  const signInWithPhone = async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => {
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      return confirmationResult;
    } catch (error) {
      console.error("Sovereign Protocol: Phone sync terminal failure.", error);
      throw error;
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };
  
  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    try {
      const profileRef = doc(db, 'users', user.uid);
      await setDoc(profileRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
      setProfile(prev => prev ? { ...prev, ...data } : null);
    } catch (error) {
      if (error instanceof Error && error.message.includes('{')) throw error;
      handleFirestoreError(error, 'update', `users/${user.uid}`);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, isAdmin, isContributor, loading, signInWithGoogle, signInWithPhone, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
