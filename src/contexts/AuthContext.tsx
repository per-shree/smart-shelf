import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Fridge, Member, Role } from '../types';

interface AuthContextType {
  user: { username: string; role: Role } | null;
  fridge: Fridge | null;
  language: string;
  setLanguage: (lang: string) => void;
  login: (username: string, password: string, role: Role) => Promise<void>;
  logout: () => void;
  updateUser: (newUsername: string) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import { OperationType, handleFirestoreError } from '../lib/firestoreUtils';

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

  const login = async (username: string, password: string, role: Role) => {
    setIsLoading(true);
    const fridgePath = 'fridges';
    try {
      const fridgesRef = collection(db, fridgePath);
      const q = query(fridgesRef, where('passwordHash', '==', password));
      
      let querySnapshot;
      try {
        querySnapshot = await getDocs(q);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, fridgePath);
        return; // Should not reach here
      }

      let currentFridge: Fridge;

      if (querySnapshot.empty) {
        // Create new fridge if Admin
        if (role === Role.Admin) {
          const newFridge = {
            passwordHash: password,
            adminUsername: username,
            createdAt: new Date().toISOString(),
          };
          try {
            const docRef = await addDoc(fridgesRef, newFridge);
            currentFridge = { id: docRef.id, ...newFridge };
          } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, fridgePath);
            return;
          }
        } else {
          setIsLoading(false);
          throw new Error('Refrigerator not found. Please contact your admin.');
        }
      } else {
        const fridgeDoc = querySnapshot.docs[0];
        currentFridge = { id: fridgeDoc.id, ...fridgeDoc.data() } as Fridge;
      }

      // Check if user is already a member
      const memberPath = `fridges/${currentFridge.id}/members`;
      const membersRef = collection(db, memberPath);
      const mq = query(membersRef, where('username', '==', username));
      
      let mSnapshot;
      try {
        mSnapshot = await getDocs(mq);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, memberPath);
        return;
      }

      let finalRole = role;

      if (mSnapshot.empty) {
        if (currentFridge.adminUsername === username) {
          if (role !== Role.Admin) {
            setIsLoading(false);
            throw new Error('Please select your correct role.');
          }
          try {
            await addDoc(membersRef, {
              username,
              role: Role.Admin,
              joinedAt: new Date().toISOString(),
            });
            finalRole = Role.Admin;
          } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, memberPath);
            return;
          }
        } else {
          setIsLoading(false);
          throw new Error('Member not found. Please contact your admin to add you first.');
        }
      } else {
        const memberData = mSnapshot.docs[0].data();
        if (memberData.role !== role) {
          setIsLoading(false);
          throw new Error('Please select your correct role.');
        }
        finalRole = memberData.role;
      }

      const userData = { username, role: finalRole };
      setUser(userData);
      setFridge(currentFridge);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('fridgeId', currentFridge.id);
    } catch (error) {
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
