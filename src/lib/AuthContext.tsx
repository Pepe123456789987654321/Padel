import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  onAuthStateChanged,
  db
} from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export interface UserAccountData {
  uid: string;
  email: string | null;
  displayName: string | null;
  phone: string;
  category: string;
  preferredSide: 'Drive' | 'Revés' | 'Ambos';
  emailVerified: boolean;
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserAccountData | null;
  loading: boolean;
  isEmailVerified: boolean;
  loginWithGoogle: () => Promise<void>;
  registerWithEmailPassword: (
    email: string,
    pass: string,
    fullName: string,
    phone?: string
  ) => Promise<{ needVerification: boolean }>;
  loginWithEmailPassword: (email: string, pass: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  refreshAuthStatus: () => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserPhoneAndCategory: (phone: string, category: string, side?: 'Drive' | 'Revés' | 'Ambos') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserAccountData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load user data from Firestore or local storage fallback
  const syncUserData = async (user: User | null) => {
    if (!user) {
      setUserData(null);
      return;
    }

    let phone = user.phoneNumber || '';
    let category = '5ta Categoría';
    let preferredSide: 'Drive' | 'Revés' | 'Ambos' = 'Ambos';

    // Try reading from Firestore
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const snapshot = await getDoc(userDocRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.phone) phone = data.phone;
        if (data.category) category = data.category;
        if (data.preferredSide) preferredSide = data.preferredSide;
      } else {
        // Create initial document
        const initialData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'Jugador',
          phone: phone || '',
          category,
          preferredSide,
          createdAt: new Date().toISOString()
        };
        await setDoc(userDocRef, initialData, { merge: true });
      }
    } catch (err) {
      console.warn('Could not read user profile from firestore, using local fallback', err);
      const storedPhone = localStorage.getItem(`user_phone_${user.uid}`);
      if (storedPhone) phone = storedPhone;
    }

    setUserData({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'Jugador',
      phone,
      category,
      preferredSide,
      emailVerified: user.emailVerified
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await syncUserData(user);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      await syncUserData(user);
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmailPassword = async (
    email: string,
    pass: string,
    fullName: string,
    phone?: string
  ) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const user = userCredential.user;

      // Update display name
      await updateProfile(user, {
        displayName: fullName
      });

      // Send verification email!
      await sendEmailVerification(user);

      // Save initial profile
      try {
        await setDoc(
          doc(db, 'users', user.uid),
          {
            uid: user.uid,
            email: user.email,
            displayName: fullName,
            phone: phone || '',
            category: '5ta Categoría',
            preferredSide: 'Ambos',
            createdAt: new Date().toISOString()
          },
          { merge: true }
        );
      } catch (e) {
        console.warn('Error creating user doc', e);
      }

      if (phone) {
        localStorage.setItem(`user_phone_${user.uid}`, phone);
      }

      await syncUserData(user);
      return { needVerification: true };
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmailPassword = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const user = userCredential.user;
      await syncUserData(user);
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    if (!currentUser) throw new Error('No hay usuario activo');
    await sendEmailVerification(currentUser);
  };

  const refreshAuthStatus = async (): Promise<boolean> => {
    if (!currentUser) return false;
    await currentUser.reload();
    const updated = auth.currentUser;
    setCurrentUser(updated);
    if (updated) {
      await syncUserData(updated);
      return updated.emailVerified;
    }
    return false;
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  const updateUserPhoneAndCategory = async (phone: string, category: string, side: 'Drive' | 'Revés' | 'Ambos' = 'Ambos') => {
    if (!currentUser) return;
    try {
      await setDoc(
        doc(db, 'users', currentUser.uid),
        { phone, category, preferredSide: side },
        { merge: true }
      );
    } catch (e) {
      console.warn('Error updating profile in firestore', e);
    }
    localStorage.setItem(`user_phone_${currentUser.uid}`, phone);
    setUserData((prev) => (prev ? { ...prev, phone, category, preferredSide: side } : null));
  };

  // Google logins or already verified email accounts are considered verified
  const isEmailVerified = Boolean(
    currentUser &&
      (currentUser.emailVerified ||
        currentUser.providerData.some((p) => p.providerId === 'google.com'))
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userData,
        loading,
        isEmailVerified,
        loginWithGoogle,
        registerWithEmailPassword,
        loginWithEmailPassword,
        resendVerification,
        refreshAuthStatus,
        sendPasswordReset,
        logout,
        updateUserPhoneAndCategory
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
