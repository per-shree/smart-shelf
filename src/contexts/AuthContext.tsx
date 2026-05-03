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
  setIsGlobalLoading: (loading: boolean) => void;
  isGlobalLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import { OperationType, handleFirestoreError } from '../lib/firestoreUtils';
import { hashPassword } from '../lib/utils';
import { emailService } from '../services/emailService';



export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ username: string; role: Role } | null>(null);
  const [fridge, setFridge] = useState<Fridge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);

  const triggerGlobalLoader = () => {
    setIsGlobalLoading(true);
    setTimeout(() => setIsGlobalLoading(false), 4000);
  };

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
        // Member logs in with: Member Username and Member Password
        // Search for all fridges that match this password (either as member password or admin password fallback)
        const q1 = query(fridgesRef, where('memberPasswordHash', '==', hashedPassword));
        const q2 = query(fridgesRef, where('passwordHash', '==', hashedPassword));
        
        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
        const allPotentialFridges = [...snap1.docs, ...snap2.docs];

        if (allPotentialFridges.length === 0) {
          throw new Error('Incorrect password or shelf not found.');
        }

        // Now find the one where this user is actually a member
        for (const fDoc of allPotentialFridges) {
          const mRef = collection(db, `fridges/${fDoc.id}/members`);
          const mq = query(mRef, where('username', '==', username));
          const mSnap = await getDocs(mq);
          
          if (!mSnap.empty) {
            currentFridge = { id: fDoc.id, ...fDoc.data() as Fridge };
            break;
          }
        }
        
        if (!currentFridge) {
          throw new Error('You are not a member of this shelf. Please contact your admin.');
        }
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

      // Send Login Alert to Admin & Member
      console.log(`[Auth] User logged in: ${username} (${role}). Checking for alert emails...`);
      
      if (currentFridge.adminEmail) {
        console.log(`[Auth] Sending alert to Admin: ${currentFridge.adminEmail}`);
        emailService.sendLoginAlert(currentFridge.adminEmail, username, role);
      } else {
        console.warn(`[Auth] No Admin Email found for fridge ${currentFridge.id}`);
      }

      // If logging in as a member, check for their specific email
      if (role === Role.Member) {
        const mPath = `fridges/${currentFridge.id}/members`;
        const mRef = collection(db, mPath);
        const mq = query(mRef, where('username', '==', username));
        const mSnap = await getDocs(mq);
        if (!mSnap.empty) {
          const mData = mSnap.docs[0].data() as Member;
          if (mData.email) {
            console.log(`[Auth] Sending alert to Member: ${mData.email}`);
            emailService.sendLoginAlert(mData.email, username, role);
          } else {
            console.log(`[Auth] Member ${username} has no email registered.`);
          }
        }
      }
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

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('lang', lang);
    i18n.changeLanguage(lang);
  };

  return (
    <AuthContext.Provider value={{ user, fridge, language, setLanguage, login, logout, updateUser, isLoading, isGlobalLoading, setIsGlobalLoading: triggerGlobalLoader }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
