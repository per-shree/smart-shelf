import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Fridge, Member, Role } from '../types';
import i18n from '../i18n';

interface AuthContextType {
  user: { username: string; role: Role; email?: string } | null;
  fridge: Fridge | null;
  language: string;
  setLanguage: (lang: string) => void;
  login: (username: string, password: string, role: Role, email?: string, isOtpVerified?: boolean) => Promise<{ requiresOtp: boolean, email?: string } | void>;
  registerMember: (username: string, password: string, shelfCode: string, email: string) => Promise<void>;
  logout: () => void;
  updateUser: (newUsername: string, newEmail: string) => Promise<void>;
  isLoading: boolean;
  setIsGlobalLoading: (loading: boolean) => void;
  isGlobalLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import { OperationType, handleFirestoreError } from '../lib/firestoreUtils';
import { hashPassword, generateShelfCode } from '../lib/utils';
import { emailService } from '../services/emailService';
import { activityService, ActivityAction } from '../services/activityService';



export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ username: string; role: Role; email?: string } | null>(null);
  const [fridge, setFridge] = useState<Fridge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);

  const triggerGlobalLoader = () => {
    setIsGlobalLoading(true);
    setTimeout(() => setIsGlobalLoading(false), 1200);
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
        onSnapshot(fridgeRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as Fridge;
            // Self-healing for old fridges missing a shelf code
            if (!data.shelfCode) {
              const newCode = generateShelfCode();
              await updateDoc(fridgeRef, { shelfCode: newCode });
              setFridge({ id: docSnap.id, ...data, shelfCode: newCode });
            } else {
              setFridge({ id: docSnap.id, ...data });
            }
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
      let memberSnapshot: any = null;

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
              shelfCode: generateShelfCode(),
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
          const data = fridgeDoc.data() as Fridge;
          currentFridge = { id: fridgeDoc.id, ...data };
          
          // Self-healing for existing fridges
          if (!currentFridge.shelfCode) {
            const newCode = generateShelfCode();
            await updateDoc(fridgeDoc.ref, { shelfCode: newCode });
            currentFridge.shelfCode = newCode;
          }
          
          if (!isOtpVerified) {
            return { requiresOtp: true, email: currentFridge.adminEmail };
          }
        }
      } else {
        // Member logs in with: Member Username and Member Password
        // Search for all fridges to find where this user is a member with this password
        const fridgesSnap = await getDocs(fridgesRef);
        const matches: { fridgeDoc: any; memberSnap: any }[] = [];

        await Promise.all(fridgesSnap.docs.map(async (fDoc) => {
          const mRef = collection(db, `fridges/${fDoc.id}/members`);
          const mq = query(mRef, where('username', '==', username), where('passwordHash', '==', hashedPassword));
          const mSnap = await getDocs(mq);
          if (!mSnap.empty) {
            matches.push({ fridgeDoc: fDoc, memberSnap: mSnap });
          }
        }));

        if (matches.length === 0) {
          throw new Error('Incorrect username or password.');
        }

        const firstMatch = matches[0];
        currentFridge = { id: firstMatch.fridgeDoc.id, ...firstMatch.fridgeDoc.data() as Fridge };
        memberSnapshot = firstMatch.memberSnap;
      }

      if (!currentFridge) throw new Error('Authentication failed.');

      // Verify membership
      const memberPath = `fridges/${currentFridge.id}/members`;
      const membersRef = collection(db, memberPath);
      
      // If we don't have the snapshot yet (e.g. Admin or just added), fetch it
      if (!memberSnapshot) {
        const mq = query(membersRef, where('username', '==', username));
        memberSnapshot = await getDocs(mq);
      }

      if (memberSnapshot.empty) {
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
        const memberData = memberSnapshot.docs[0].data();
        if (memberData.role !== role) {
          throw new Error(`Unauthorized access as ${role}.`);
        }
      }

      let userEmail = '';
      if (role === Role.Admin) {
        userEmail = currentFridge.adminEmail || '';
      } else if (!memberSnapshot.empty) {
        const mData = memberSnapshot.docs[0].data() as Member;
        userEmail = mData.email || '';
      }

      const userData = { username, role, email: userEmail };
      setUser(userData);
      setFridge(currentFridge);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('fridgeId', currentFridge.id);

      // Log Activity
      await activityService.log(currentFridge.id, username, ActivityAction.LOGIN, `${username} logged in as ${role}`);

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

  const registerMember = async (username: string, password: string, shelfCode: string, email: string) => {
    setIsLoading(true);
    try {
      const hashedPassword = await hashPassword(password);
      const fridgesRef = collection(db, 'fridges');
      
      // Find the fridge by shelf code
      const q = query(fridgesRef, where('shelfCode', '==', shelfCode));
      const fridgeSnap = await getDocs(q);
      
      if (fridgeSnap.empty) {
        throw new Error('Invalid Shelf Code. Please ask your admin for the correct code.');
      }
      
      const fridgeDoc = fridgeSnap.docs[0];
      
      // Check if user already exists in this fridge
      const membersRef = collection(db, `fridges/${fridgeDoc.id}/members`);
      const mq = query(membersRef, where('username', '==', username));
      const mSnap = await getDocs(mq);
      
      if (!mSnap.empty) {
        throw new Error('Username already taken in this shelf. Please choose another.');
      }
      
      const fridgeData = fridgeDoc.data() as Fridge;
      
      // Add new member
      await addDoc(membersRef, {
        fridgeId: fridgeDoc.id,
        username,
        email,
        passwordHash: hashedPassword,
        role: Role.Member,
        joinedAt: new Date().toISOString(),
      });
      
      // Log Activity
      await activityService.log(fridgeDoc.id, username, ActivityAction.REGISTER, `${username} registered as a new member`);
      
      // Auto-login
      const userData = { username, role: Role.Member, email };
      setUser(userData);
      setFridge({ id: fridgeDoc.id, ...fridgeData });
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('fridgeId', fridgeDoc.id);
      
      // Send alert to admin if email exists
      if (fridgeData.adminEmail) {
        emailService.sendLoginAlert(fridgeData.adminEmail, username, Role.Member);
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

  const updateUser = async (newUsername: string, newEmail: string) => {
    if (!user || !fridge) return;
    
    const memberPath = `fridges/${fridge.id}/members`;
    const membersRef = collection(db, memberPath);
    const mq = query(membersRef, where('username', '==', user.username));
    
    try {
      const mSnapshot = await getDocs(mq);
      if (!mSnapshot.empty) {
        const memberDoc = mSnapshot.docs[0];
        await updateDoc(doc(db, memberPath, memberDoc.id), {
          username: newUsername,
          email: newEmail
        });
      }
      
      // If Admin, also update the fridge's adminEmail
      if (user.role === Role.Admin) {
        await updateDoc(doc(db, 'fridges', fridge.id), {
          adminEmail: newEmail
        });
      }

      const newUser = { ...user, username: newUsername, email: newEmail };
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
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
    <AuthContext.Provider value={{ user, fridge, language, setLanguage, login, registerMember, logout, updateUser, isLoading, isGlobalLoading, setIsGlobalLoading: triggerGlobalLoader }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
