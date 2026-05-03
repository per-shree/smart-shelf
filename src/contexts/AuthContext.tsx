import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Fridge, Member, Role } from '../types';
import i18n from '../i18n';

interface AuthContextType {
  user: { username: string; role: Role } | null;
  fridge: Fridge | null;
  language: string;
  setLanguage: (lang: string) => void;
  login: (username: string, password: string, role: Role, email?: string, isOtpVerified?: boolean) => Promise<{ requiresOtp: boolean, email?: string } | void>;
  logout: () => void;
  updateUser: (newUsername: string) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import { OperationType, handleFirestoreError } from '../lib/firestoreUtils';
import { hashPassword } from '../lib/utils';



export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ username: string; role: Role } | null>(null);
  const [fridge, setFridge] = useState<Fridge | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedFridgeId = localStorage.getItem('fridgeId');

    if (savedUser && savedFridgeId) {
      setUser(JSON.parse(savedUser));
      // Fetch fridge data
      const fetchFridge = async () => {
        const fridgePath = `fridges/${savedFridgeId}`;
        const fridgeRef = doc(db, fridgePath);
        onSnapshot(fridgeRef, (docSnap) => {
          if (docSnap.exists()) {
            setFridge({ id: docSnap.id, ...docSnap.data() } as Fridge);
          }
          setIsLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, fridgePath);
        });
      };
      fetchFridge();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string, role: Role, shelfAdmin?: string, email?: string, isOtpVerified?: boolean): Promise<{ requiresOtp: boolean, email?: string } | void> => {
    setIsLoading(true);
    const fridgePath = 'fridges';
    try {
      const hashedPassword = await hashPassword(password);
      const fridgesRef = collection(db, fridgePath);
      
      let currentFridge: Fridge | null = null;

      if (role === Role.Admin) {
        // Admin logs in with their own username and password
        const q = query(fridgesRef, where('adminUsername', '==', username), where('passwordHash', '==', hashedPassword));
        const snap = await getDocs(q);
        
        if (snap.empty) {
          // Check if this is a registration attempt (email provided)
          if (email && isOtpVerified) {
            const newFridge = {
              passwordHash: hashedPassword,
              memberPasswordHash: hashedPassword, // Default member password same as admin for new setup
              adminUsername: username,
              adminEmail: email,
              createdAt: new Date().toISOString(),
            };
            const docRef = await addDoc(fridgesRef, newFridge);
            currentFridge = { id: docRef.id, ...newFridge };
          } else if (email) {
            // Need OTP verification
            return { requiresOtp: true, email };
          } else {
            throw new Error('Admin credentials incorrect.');
          }
        } else {
          const fridgeDoc = snap.docs[0];
          currentFridge = { id: fridgeDoc.id, ...fridgeDoc.data() as Fridge };
          
          if (!isOtpVerified) {
            return { requiresOtp: true, email: currentFridge.adminEmail };
          }
        }
      } else {
        // Member logs in with: Member Username, Shelf Admin's Username, and Member Password
        if (!shelfAdmin) throw new Error('Please provide the Admin Username for your shelf.');
        
        const q = query(fridgesRef, where('adminUsername', '==', shelfAdmin));
        const snap = await getDocs(q);
        
        if (snap.empty) {
          throw new Error('Shelf not found. Check the Admin Username.');
        }
        
        const fridgeData = snap.docs[0].data() as Fridge;
        const fridgeId = snap.docs[0].id;
        
        // Check password against memberPasswordHash (fallback to passwordHash if not set)
        const targetHash = fridgeData.memberPasswordHash || fridgeData.passwordHash;
        if (hashedPassword !== targetHash) {
          throw new Error('Incorrect shelf password.');
        }
        
        currentFridge = { id: fridgeId, ...fridgeData };
      }

      if (!currentFridge) throw new Error('Authentication failed.');

      // Verify membership
      const memberPath = `fridges/${currentFridge.id}/members`;
      const membersRef = collection(db, memberPath);
      const mq = query(membersRef, where('username', '==', username));
      const mSnapshot = await getDocs(mq);

      if (mSnapshot.empty) {
        if (role === Role.Admin) {
          // Auto-add admin as member if first time
          await addDoc(membersRef, {
            username,
            role: Role.Admin,
            joinedAt: new Date().toISOString(),
          });
        } else {
          throw new Error('Member not found. Please contact your admin to add you first.');
        }
      } else {
        const memberData = mSnapshot.docs[0].data();
        if (memberData.role !== role) {
          throw new Error(`Unauthorized access as ${role}.`);
        }
      }

      const userData = { username, role };
      setUser(userData);
      setFridge(currentFridge);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('fridgeId', currentFridge.id);
    } catch (error: any) {
      console.error(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setFridge(null);
    localStorage.removeItem('user');
    localStorage.removeItem('fridgeId');
  };

  const updateUser = async (newUsername: string) => {
    if (!user || !fridge) return;
    
    const memberPath = `fridges/${fridge.id}/members`;
    const membersRef = collection(db, memberPath);
    const mq = query(membersRef, where('username', '==', user.username));
    
    try {
      const mSnapshot = await getDocs(mq);
      if (!mSnapshot.empty) {
        const memberDoc = mSnapshot.docs[0];
        await updateDoc(doc(db, memberPath, memberDoc.id), {
          username: newUsername
        });
      }
      
      const updatedUser = { ...user, username: newUsername };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error("Failed to update user profile", error);
      throw error;
    }
  };

  const [language, setLanguageState] = useState<string>(localStorage.getItem('lang') || 'en');

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('lang', lang);
    i18n.changeLanguage(lang);
  };

  return (
    <AuthContext.Provider value={{ user, fridge, language, setLanguage, login, logout, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
