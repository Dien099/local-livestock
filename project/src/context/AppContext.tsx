import { createContext, useContext, useReducer, useEffect, type ReactNode, type Dispatch } from 'react';
import type { PersistedState, AppAction, User, Listing, Offer, Review, AppNotification } from '@/types';
import { getCategoryImage } from '@/data/mockData';
import { DEFAULT_CATEGORIES } from '@/data/regions';

const STORAGE_KEY = 'local-livestock-state-v2';

const emptyState: PersistedState = {
  users: [],
  listings: [],
  offers: [],
  reviews: [],
  notifications: [],
  customCategories: [],
  isDark: false,
  currentUserId: null,
  rememberMe: false,
};

function loadState(): PersistedState {
  if (typeof window === 'undefined') return emptyState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      users: parsed.users ?? [],
      listings: parsed.listings ?? [],
      offers: parsed.offers ?? [],
      reviews: parsed.reviews ?? [],
      notifications: parsed.notifications ?? [],
      customCategories: parsed.customCategories ?? [],
      isDark: parsed.isDark ?? false,
      currentUserId: parsed.currentUserId ?? null,
      rememberMe: parsed.rememberMe ?? false,
    };
  } catch {
    return emptyState;
  }
}

function genId(prefix: string): string {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

function pushNotification(
  notifications: AppNotification[],
  userId: string,
  type: AppNotification['type'],
  title: string,
  message: string,
  offerId?: string
): AppNotification[] {
  const n: AppNotification = {
    id: genId('n'),
    userId,
    type,
    title,
    message,
    offerId,
    read: false,
    createdAt: new Date().toISOString(),
  };
  return [n, ...notifications];
}

function reducer(state: PersistedState, action: AppAction): PersistedState {
  switch (action.type) {
    case 'HYDRATE':
      return action.payload;

    case 'TOGGLE_THEME':
      return { ...state, isDark: !state.isDark };

    case 'SET_DARK':
      return { ...state, isDark: action.payload };

    case 'REGISTER': {
      const newUser: User = {
        ...action.payload,
        id: genId('u'),
        qualityRating: 0,
        serviceRating: 0,
        reviewCount: 0,
        createdAt: new Date().toISOString(),
      };
      return { ...state, users: [...state.users, newUser], currentUserId: newUser.id, rememberMe: true };
    }

    case 'LOGIN': {
      const user = state.users.find(
        (u) => u.email.toLowerCase() === action.payload.email.toLowerCase() && u.password === action.payload.password
      );
      if (!user) return state;
      return { ...state, currentUserId: user.id, rememberMe: action.payload.rememberMe };
    }

    case 'LOGOUT':
      return { ...state, currentUserId: null, rememberMe: false };

    case 'UPDATE_PROFILE': {
      const users = state.users.map((u) =>
        u.id === state.currentUserId ? { ...u, ...action.payload } : u
      );
      return { ...state, users };
    }

    case 'CREATE_LISTING': {
      const dealer = state.users.find((u) => u.id === action.payload.dealerId);
      if (!dealer) return state;
      const batchNumber = `${action.payload.category.slice(0, 2).toUpperCase()}-${new Date().getFullYear()}-${String(state.listings.length + 1).padStart(4, '0')}`;
      const newListing: Listing = {
        ...action.payload,
        id: genId('l'),
        batchNumber,
        dealerName: dealer.name,
        farmName: dealer.farmName || dealer.name,
        isActive: true,
        createdAt: new Date().toISOString(),
        imageUrl: getCategoryImage(action.payload.category),
      };
      return { ...state, listings: [newListing, ...state.listings] };
    }

    case 'ADD_CUSTOM_CATEGORY': {
      if (state.customCategories.includes(action.payload) || DEFAULT_CATEGORIES.includes(action.payload)) {
        return state;
      }
      return { ...state, customCategories: [...state.customCategories, action.payload] };
    }

    case 'SUBMIT_OFFER': {
      const newOffer: Offer = {
        ...action.payload,
        id: genId('o'),
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        rated: false,
      };
      const notifications = pushNotification(
        state.notifications,
        action.payload.dealerId,
        'offer_received',
        'New Offer Received',
        `${action.payload.buyerName} requested ${action.payload.quantity} head`,
        newOffer.id
      );
      return { ...state, offers: [newOffer, ...state.offers], notifications };
    }

    case 'APPROVE_OFFER': {
      const { offerId, dealerNotes, scheduledPickupWindow, deliveryFee } = action.payload;
      const offer = state.offers.find((o) => o.id === offerId);
      if (!offer) return state;

      const listings = state.listings.map((l) =>
        l.id === offer.listingId
          ? { ...l, availableStock: Math.max(0, l.availableStock - offer.quantity) }
          : l
      );

      const offers = state.offers.map((o) =>
        o.id === offerId
          ? { ...o, status: 'APPROVED' as const, dealerNotes, scheduledPickupWindow, deliveryFee, completedAt: new Date().toISOString() }
          : o
      );

      const notifications = pushNotification(
        state.notifications,
        offer.buyerId,
        'offer_approved',
        'Offer Approved',
        `Your offer has been approved by the dealer`,
        offerId
      );

      return { ...state, listings, offers, notifications };
    }

    case 'REJECT_OFFER': {
      const offer = state.offers.find((o) => o.id === action.payload);
      const offers = state.offers.map((o) =>
        o.id === action.payload ? { ...o, status: 'REJECTED' as const } : o
      );
      const notifications = offer
        ? pushNotification(state.notifications, offer.buyerId, 'offer_rejected', 'Offer Rejected', 'Your offer was declined by the dealer', offer.id)
        : state.notifications;
      return { ...state, offers, notifications };
    }

    case 'COMPLETE_OFFER': {
      const offer = state.offers.find((o) => o.id === action.payload);
      const offers = state.offers.map((o) =>
        o.id === action.payload
          ? { ...o, status: 'COMPLETED' as const, completedAt: new Date().toISOString() }
          : o
      );
      const notifications = offer
        ? pushNotification(state.notifications, offer.buyerId, 'offer_completed', 'Transaction Completed', 'Your transaction is complete. You can now rate the dealer.', offer.id)
        : state.notifications;
      return { ...state, offers, notifications };
    }

    case 'SUBMIT_REVIEW': {
      const newReview: Review = {
        ...action.payload,
        id: genId('r'),
        createdAt: new Date().toISOString(),
      };

      const offers = state.offers.map((o) =>
        o.id === action.payload.offerId ? { ...o, rated: true } : o
      );

      const users = state.users.map((u) => {
        if (u.id !== action.payload.dealerId) return u;
        const dealerReviews = [...state.reviews.filter((r) => r.dealerId === u.id), newReview];
        const totalQuality = dealerReviews.reduce((sum, r) => sum + r.qualityRating, 0);
        const totalService = dealerReviews.reduce((sum, r) => sum + r.serviceRating, 0);
        return {
          ...u,
          qualityRating: Math.round((totalQuality / dealerReviews.length) * 10) / 10,
          serviceRating: Math.round((totalService / dealerReviews.length) * 10) / 10,
          reviewCount: dealerReviews.length,
        };
      });

      return { ...state, reviews: [newReview, ...state.reviews], offers, users };
    }

    case 'MARK_NOTIFICATIONS_READ': {
      const idSet = new Set(action.payload);
      const notifications = state.notifications.map((n) =>
        idSet.has(n.id) ? { ...n, read: true } : n
      );
      return { ...state, notifications };
    }

    default:
      return state;
  }
}

interface AppContextValue {
  state: PersistedState;
  dispatch: Dispatch<AppAction>;
  currentUser: User | null;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, emptyState, loadState);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (state.rememberMe || state.currentUserId === null) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }
    } catch {
      // storage full or unavailable; ignore
    }
  }, [state]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (state.isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.isDark]);

  const currentUser = state.users.find((u) => u.id === state.currentUserId) ?? null;

  return (
    <AppContext.Provider value={{ state, dispatch, currentUser }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
