import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export enum ActivityAction {
  LOGIN = 'Login',
  REGISTER = 'Register',
  ADD_PRODUCT = 'Add Product',
  REMOVE_PRODUCT = 'Remove Product',
  EDIT_PRODUCT = 'Edit Product',
  AI_CHAT = 'AI Chat',
  UPDATE_SETTINGS = 'Update Settings',
}

export const activityService = {
  async log(fridgeId: string, username: string, action: string, details: string) {
    try {
      const logsRef = collection(db, `fridges/${fridgeId}/activity_logs`);
      await addDoc(logsRef, {
        action,
        details,
        timestamp: new Date().toISOString(),
        user: username,
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }
};
