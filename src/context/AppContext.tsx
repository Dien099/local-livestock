import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import {
  type Profile, type Listing, type Offer, type Review, type AppNotification,
  type AddressTemplate, type AccountType, type FulfillmentMethod,
  type ProfileRow, type ListingRow, type OfferRow, type ReviewRow, type NotificationRow,
  type AddressTemplateRow,
  mapProfile, mapListing, mapOffer, mapReview, mapNotification, mapAddressTemplate,
} from '@/types';
import { getCategoryImage } from '@/data/mockData';
import { DEFAULT_CATEGORIES } from '@/data/regions';

interface RegisterParams {
  accountType: AccountType;
  name: string;
  email: string;
  password: string;
  region: string;
  province: string;
  municipality: string;
  farmName?: string;
}

interface OfferParams {
  listingId: string;
  dealerId: string;
  buyerName: string;
  buyerContact: string;
  quantity: number;
  fulfillmentMethod: FulfillmentMethod;
  preferredDate: string;
  deliveryFee?: number;
  deliveryAddress?: string;
}

interface ListingParams {
  title: string;
  category: string;
  pricePerHead: number;
  availableStock: number;
  region: string;
  province: string;
  municipality: string;
  description: string;
}

interface ReviewParams {
  offerId: string;
  dealerId: string;
  qualityRating: number;
  serviceRating: number;
  comment: string;
  buyerName: string;
}

interface ApproveParams {
  offerId: string;
  dealerNotes: string;
  scheduledPickupWindow?: string;
  deliveryFee?: number;
}

interface AddressTemplateParams {
  label: string;
  fullName: string;
  phoneNumber: string;
  region: string;
  province: string;
  municipality: string;
  detailedAddress: string;
  isDefault?: boolean;
}

interface AppContextValue {
  session: Session | null;
  currentUser: Profile | null;
  listings: Listing[];
  myOffers: Offer[];
  incomingOffers: Offer[];
  reviews: Review[];
  notifications: AppNotification[];
  addressTemplates: AddressTemplate[];
  categories: string[];
  isDark: boolean;
  loading: boolean;
  authLoading: boolean;
  customCategories: string[];
  toggleTheme: () => void;
  setDark: (v: boolean) => void;
  signIn: (email: string, password: string, rememberMe: boolean) => Promise<{ error?: string }>;
  signUp: (params: RegisterParams) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<Profile, 'name' | 'farmName' | 'phone' | 'region' | 'province' | 'municipality'>>) => Promise<{ error?: string }>;
  uploadAvatar: (file: File) => Promise<{ error?: string }>;
  createListing: (params: ListingParams) => Promise<{ error?: string }>;
  addCustomCategory: (name: string) => Promise<void>;
  submitOffer: (params: OfferParams) => Promise<{ error?: string }>;
  approveOffer: (params: ApproveParams) => Promise<{ error?: string }>;
  rejectOffer: (offerId: string) => Promise<{ error?: string }>;
  submitReview: (params: ReviewParams) => Promise<{ error?: string }>;
  sendDealerReminder: (offerId: string, message: string) => Promise<{ error?: string }>;
  getAddressTemplates: () => Promise<void>;
  saveAddressTemplate: (params: AddressTemplateParams) => Promise<{ error?: string }>;
  deleteAddressTemplate: (id: string) => Promise<{ error?: string }>;
  setDefaultAddressTemplate: (id: string) => Promise<{ error?: string }>;
  getBuyerProfile: (buyerId: string) => Promise<Profile | null>;
  markNotificationsRead: (ids: string[]) => Promise<void>;
  refresh: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [myOffers, setMyOffers] = useState<Offer[]>([]);
  const [incomingOffers, setIncomingOffers] = useState<Offer[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [addressTemplates, setAddressTemplates] = useState<AddressTemplate[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);

  // ---- Theme (still localStorage — it's a UI preference, not app data) ----
  useEffect(() => {
    const stored = localStorage.getItem('local-livestock-theme');
    setIsDark(stored === 'dark');
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('local-livestock-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('local-livestock-theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = useCallback(() => setIsDark((d) => !d), []);
  const setDark = useCallback((v: boolean) => setIsDark(v), []);

  // ---- Auth state ----
  useEffect(() => {
    setAuthLoading(true);
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign out ephemeral (non-remember-me) sessions on tab close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionStorage.getItem('local-livestock-session') === 'ephemeral') {
        supabase.auth.signOut();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // ---- Load profile + app data when session changes ----
  const refresh = useCallback(async () => {
    if (!session?.user) {
      setCurrentUser(null);
      setListings([]);
      setMyOffers([]);
      setIncomingOffers([]);
      setReviews([]);
      setNotifications([]);
      setAddressTemplates([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const userId = session.user.id;

    const [profileRes, listingsRes, offersRes, reviewsRes, notifRes, catRes, templatesRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('listings').select('*').order('created_at', { ascending: false }),
      supabase.from('offers').select('*').order('created_at', { ascending: false }),
      supabase.from('reviews').select('*').order('created_at', { ascending: false }),
      supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('categories').select('name').order('name'),
      supabase.from('address_templates').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    ]);

    const profile = profileRes.data ? mapProfile(profileRes.data as ProfileRow) : null;
    setCurrentUser(profile);

    // Build a dealer map for listing enrichment — now includes ratings + avatar
    const dealerIds = [...new Set((listingsRes.data as ListingRow[] || []).map((l) => l.dealer_id))];
    const dealerMap = new Map<string, { name: string; farmName: string; avatarUrl: string | null; qualityRating: number; serviceRating: number; reviewCount: number }>();
    if (dealerIds.length > 0) {
      const { data: dealers } = await supabase
        .from('profiles')
        .select('id, name, farm_name, avatar_url, quality_rating, service_rating, review_count')
        .in('id', dealerIds);
      (dealers as ProfileRow[] || []).forEach((d) => {
        dealerMap.set(d.id, {
          name: d.name,
          farmName: d.farm_name || d.name,
          avatarUrl: d.avatar_url,
          qualityRating: Number(d.quality_rating),
          serviceRating: Number(d.service_rating),
          reviewCount: d.review_count,
        });
      });
    }

    const mappedListings = (listingsRes.data as ListingRow[] || []).map((row) => {
      const dealer = dealerMap.get(row.dealer_id);
      return mapListing(
        row,
        dealer?.name ?? 'Unknown',
        dealer?.farmName ?? 'Unknown',
        dealer ? { avatarUrl: dealer.avatarUrl, qualityRating: dealer.qualityRating, serviceRating: dealer.serviceRating, reviewCount: dealer.reviewCount } : undefined
      );
    });
    setListings(mappedListings);

    const allOffers = (offersRes.data as OfferRow[] || []).map(mapOffer);
    setMyOffers(allOffers.filter((o) => o.buyerId === userId));
    setIncomingOffers(allOffers.filter((o) => o.dealerId === userId));

    setReviews((reviewsRes.data as ReviewRow[] || []).map(mapReview));
    setNotifications((notifRes.data as NotificationRow[] || []).map(mapNotification));
    setAddressTemplates((templatesRes.data as AddressTemplateRow[] || []).map(mapAddressTemplate));
    setCategories([...new Set([...DEFAULT_CATEGORIES, ...((catRes.data as { name: string }[] || []).map((c) => c.name))])]);

    setLoading(false);
  }, [session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ---- Auth actions ----
  const signIn = useCallback(async (email: string, password: string, rememberMe: boolean) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: error.message };

    if (!rememberMe) {
      sessionStorage.setItem('local-livestock-session', 'ephemeral');
    } else {
      sessionStorage.removeItem('local-livestock-session');
    }
    return {};
  }, []);

  const signUp = useCallback(async (params: RegisterParams) => {
    const { data, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          account_type: params.accountType,
          name: params.name,
          farm_name: params.farmName || null,
          region: params.region,
          province: params.province,
          municipality: params.municipality,
        },
      },
    });
    if (error) return { error: error.message };
    if (!data.user) return { error: 'Sign-up failed. Please try again.' };
    return {};
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setSession(null);
  }, []);

  // ---- Profile update ----
  const updateProfile = useCallback(async (updates: Partial<Pick<Profile, 'name' | 'farmName' | 'phone' | 'region' | 'province' | 'municipality'>>) => {
    if (!session?.user) return { error: 'Not authenticated' };
    const row: Record<string, string | null> = {};
    if (updates.name !== undefined) row.name = updates.name;
    if (updates.farmName !== undefined) row.farm_name = updates.farmName || null;
    if (updates.phone !== undefined) row.phone = updates.phone || null;
    if (updates.region !== undefined) row.region = updates.region;
    if (updates.province !== undefined) row.province = updates.province;
    if (updates.municipality !== undefined) row.municipality = updates.municipality;

    const { error } = await supabase.from('profiles').update(row).eq('id', session.user.id);
    if (error) return { error: error.message };
    await refresh();
    return {};
  }, [session, refresh]);

  // ---- Avatar upload ----
  const uploadAvatar = useCallback(async (file: File) => {
    if (!session?.user) return { error: 'Not authenticated' };
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `${session.user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });
    if (uploadError) return { error: uploadError.message };

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', session.user.id);
    if (updateError) return { error: updateError.message };

    await refresh();
    return {};
  }, [session, refresh]);

  // ---- Listing creation ----
  const createListing = useCallback(async (params: ListingParams) => {
    if (!session?.user) return { error: 'Not authenticated' };
    const { count } = await supabase.from('listings').select('*', { count: 'exact', head: true });
    const batchNumber = `${params.category.slice(0, 2).toUpperCase()}-${new Date().getFullYear()}-${String((count ?? 0) + 1).padStart(4, '0')}`;

    const { error } = await supabase.from('listings').insert({
      dealer_id: session.user.id,
      title: params.title,
      category: params.category,
      batch_number: batchNumber,
      price_per_head: params.pricePerHead,
      available_stock: params.availableStock,
      original_stock: params.availableStock,
      region: params.region,
      province: params.province,
      municipality: params.municipality,
      description: params.description,
      image_url: getCategoryImage(params.category),
      is_active: true,
    });
    if (error) return { error: error.message };
    await refresh();
    return {};
  }, [session, refresh]);

  // ---- Custom category ----
  const addCustomCategory = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    await supabase.from('categories').insert({ name: trimmed });
    setCategories((prev) => [...new Set([...prev, trimmed])]);
  }, [categories]);

  // ---- Offer submission ----
  const submitOffer = useCallback(async (params: OfferParams) => {
    if (!session?.user) return { error: 'Not authenticated' };

    const { error } = await supabase.from('offers').insert({
      listing_id: params.listingId,
      dealer_id: params.dealerId,
      buyer_id: session.user.id,
      buyer_name: params.buyerName,
      buyer_contact: params.buyerContact,
      quantity: params.quantity,
      fulfillment_method: params.fulfillmentMethod,
      preferred_date: params.preferredDate,
      delivery_fee: params.deliveryFee ?? null,
      delivery_address: params.deliveryAddress || null,
      status: 'PENDING',
    });
    if (error) return { error: error.message };

    // Notify the dealer
    await supabase.from('notifications').insert({
      user_id: params.dealerId,
      type: 'offer_received',
      title: 'New Offer Received',
      message: `${params.buyerName} requested ${params.quantity} head`,
    });

    await refresh();
    return {};
  }, [session, refresh]);

  // ---- Approve offer (atomic RPC) ----
  const approveOffer = useCallback(async (params: ApproveParams) => {
    const { error } = await supabase.rpc('approve_offer', {
      p_offer_id: params.offerId,
      p_dealer_notes: params.dealerNotes,
      p_scheduled_pickup_window: params.scheduledPickupWindow ?? null,
      p_delivery_fee: params.deliveryFee ?? null,
    });
    if (error) return { error: error.message };
    await refresh();
    return {};
  }, [refresh]);

  // ---- Reject offer (atomic RPC) ----
  const rejectOffer = useCallback(async (offerId: string) => {
    const { error } = await supabase.rpc('reject_offer', { p_offer_id: offerId });
    if (error) return { error: error.message };
    await refresh();
    return {};
  }, [refresh]);

  // ---- Submit review ----
  const submitReview = useCallback(async (params: ReviewParams) => {
    if (!session?.user) return { error: 'Not authenticated' };

    const { error: reviewError } = await supabase.from('reviews').insert({
      offer_id: params.offerId,
      dealer_id: params.dealerId,
      buyer_id: session.user.id,
      quality_rating: params.qualityRating,
      service_rating: params.serviceRating,
      comment: params.comment,
      buyer_name: params.buyerName,
    });
    if (reviewError) return { error: reviewError.message };

    // Mark offer as rated
    const { error: offerError } = await supabase
      .from('offers')
      .update({ rated: true })
      .eq('id', params.offerId);
    if (offerError) return { error: offerError.message };

    await refresh();
    return {};
  }, [session, refresh]);

  // ---- Send dealer reminder to buyer ----
  const sendDealerReminder = useCallback(async (offerId: string, message: string) => {
    const { error } = await supabase.rpc('send_dealer_reminder', {
      p_offer_id: offerId,
      p_message: message,
    });
    if (error) return { error: error.message };
    await refresh();
    return {};
  }, [refresh]);

  // ---- Address templates ----
  const getAddressTemplates = useCallback(async () => {
    if (!session?.user) return;
    const { data, error } = await supabase
      .from('address_templates')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    if (error) return;
    setAddressTemplates((data as AddressTemplateRow[] || []).map(mapAddressTemplate));
  }, [session]);

  const saveAddressTemplate = useCallback(async (params: AddressTemplateParams) => {
    if (!session?.user) return { error: 'Not authenticated' };

    if (params.isDefault) {
      await supabase
        .from('address_templates')
        .update({ is_default: false })
        .eq('user_id', session.user.id);
    }

    const { error } = await supabase.from('address_templates').insert({
      user_id: session.user.id,
      label: params.label,
      full_name: params.fullName,
      phone_number: params.phoneNumber,
      region: params.region,
      province: params.province,
      municipality: params.municipality,
      detailed_address: params.detailedAddress,
      is_default: params.isDefault ?? false,
    });
    if (error) return { error: error.message };
    await getAddressTemplates();
    return {};
  }, [session, getAddressTemplates]);

  const deleteAddressTemplate = useCallback(async (id: string) => {
    const { error } = await supabase.from('address_templates').delete().eq('id', id);
    if (error) return { error: error.message };
    await getAddressTemplates();
    return {};
  }, [getAddressTemplates]);

  const setDefaultAddressTemplate = useCallback(async (id: string) => {
    if (!session?.user) return { error: 'Not authenticated' };
    await supabase
      .from('address_templates')
      .update({ is_default: false })
      .eq('user_id', session.user.id);
    const { error } = await supabase
      .from('address_templates')
      .update({ is_default: true })
      .eq('id', id);
    if (error) return { error: error.message };
    await getAddressTemplates();
    return {};
  }, [session, getAddressTemplates]);

  // ---- Get buyer profile (for dealers viewing buyer details) ----
  const getBuyerProfile = useCallback(async (buyerId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', buyerId)
      .maybeSingle();
    if (error || !data) return null;
    return mapProfile(data as ProfileRow);
  }, []);

  // ---- Mark notifications read ----
  const markNotificationsRead = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    await supabase.from('notifications').update({ read: true }).in('id', ids);
    setNotifications((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)));
  }, []);

  const value: AppContextValue = {
    session,
    currentUser,
    listings,
    myOffers,
    incomingOffers,
    reviews,
    notifications,
    addressTemplates,
    categories,
    isDark,
    loading,
    authLoading,
    customCategories: categories.filter((c) => !DEFAULT_CATEGORIES.includes(c)),
    toggleTheme,
    setDark,
    signIn,
    signUp,
    signOut,
    updateProfile,
    uploadAvatar,
    createListing,
    addCustomCategory,
    submitOffer,
    approveOffer,
    rejectOffer,
    submitReview,
    sendDealerReminder,
    getAddressTemplates,
    saveAddressTemplate,
    deleteAddressTemplate,
    setDefaultAddressTemplate,
    getBuyerProfile,
    markNotificationsRead,
    refresh,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
