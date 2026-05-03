export enum Role {
  Admin = 'Admin',
  Member = 'Member',
}

export enum Status {
  Fresh = 'fresh',
  NearExpiry = 'near_expiry',
  Expired = 'expired',
}

export interface Product {
  id: string;
  fridgeId: string;
  name: string;
  category: string;
  expiryDate: string;
  quantity: number;
  status: Status;
  addedBy: string;
  addedAt: string;
  isRemoved: boolean;
}

export interface Member {
  id: string;
  fridgeId: string;
  username: string;
  email?: string;
  passwordHash: string;
  role: Role;
  joinedAt: string;
}

export interface ShoppingItem {
  id: string;
  fridgeId: string;
  name: string;
  type: 'auto' | 'manual';
  reason?: string;
  isPurchased: boolean;
  addedAt: string;
}

export interface Fridge {
  id: string;
  passwordHash: string;
  memberPasswordHash?: string; // New field for members
  adminUsername: string;
  adminEmail?: string;
  shelfCode: string;
  createdAt: string;
}

export type Language = 'en' | 'hi' | 'mr';
