export interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  expiryDate: string;
  isRemoved: boolean;
  addedBy?: string;
  addedAt?: string;
  imageUrl?: string;  // Add this line
}