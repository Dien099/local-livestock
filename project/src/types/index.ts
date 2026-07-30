export type FulfillmentMethod = 'pickup' | 'delivery';
export type OfferStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
export type AccountType = 'customer' | 'dealer';

export interface User {
  id: string;
  accountType: AccountType;
  name: string;
  email: string;
  password: string;
  region: string;
  province: string;
  municipality: string;
  farmName?: string;
  phone?: string;
  qualityRating: number;
  serviceRating: number;
  reviewCount: number;
  createdAt: string;
}

export interface Listing {
  id: string;
  dealerId: string;
  dealerName: string;
  farmName: string;
  title: string;
  category: string;
  batchNumber: string;
  pricePerHead: number;
  availableStock: number;
  originalStock: number;
  region: string;
  province: string;
  municipality: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
}

export interface Offer {
  id: string;
  listingId: string;
  dealerId: string;
  buyerId: string;
  buyerName: string;
  buyerContact: string;
  quantity: number;
  fulfillmentMethod: FulfillmentMethod;
  preferredDate?: string;
  status: OfferStatus;
  createdAt: string;
  dealerNotes?: string;
  scheduledPickupWindow?: string;
  deliveryFee?: number;
  completedAt?: string;
  rated: boolean;
}

export interface Review {
  id: string;
  offerId: string;
  dealerId: string;
  qualityRating: number;
  serviceRating: number;
  comment: string;
  buyerName: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: 'offer_received' | 'offer_approved' | 'offer_rejected' | 'offer_completed';
  title: string;
  message: string;
  offerId?: string;
  read: boolean;
  createdAt: string;
}

export interface PersistedState {
  users: User[];
  listings: Listing[];
  offers: Offer[];
  reviews: Review[];
  notifications: AppNotification[];
  customCategories: string[];
  isDark: boolean;
  currentUserId: string | null;
  rememberMe: boolean;
}

export type AppAction =
  | { type: 'SET_DARK'; payload: boolean }
  | { type: 'TOGGLE_THEME' }
  | { type: 'REGISTER'; payload: Omit<User, 'id' | 'createdAt' | 'qualityRating' | 'serviceRating' | 'reviewCount'> }
  | { type: 'LOGIN'; payload: { email: string; password: string; rememberMe: boolean } }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_PROFILE'; payload: Partial<Pick<User, 'name' | 'farmName' | 'phone' | 'province' | 'region' | 'municipality'>> }
  | { type: 'CREATE_LISTING'; payload: Omit<Listing, 'id' | 'createdAt' | 'batchNumber' | 'isActive' | 'dealerName' | 'farmName' | 'imageUrl'> }
  | { type: 'ADD_CUSTOM_CATEGORY'; payload: string }
  | { type: 'SUBMIT_OFFER'; payload: Omit<Offer, 'id' | 'createdAt' | 'rated' | 'status'> }
  | { type: 'APPROVE_OFFER'; payload: { offerId: string; dealerNotes: string; scheduledPickupWindow?: string; deliveryFee?: number } }
  | { type: 'REJECT_OFFER'; payload: string }
  | { type: 'COMPLETE_OFFER'; payload: string }
  | { type: 'SUBMIT_REVIEW'; payload: Omit<Review, 'id' | 'createdAt'> }
  | { type: 'MARK_NOTIFICATIONS_READ'; payload: string[] }
  | { type: 'HYDRATE'; payload: PersistedState };
