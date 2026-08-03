export type FulfillmentMethod = 'pickup' | 'delivery';
export type OfferStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
export type AccountType = 'customer' | 'dealer';

export interface Profile {
  id: string;
  accountType: AccountType;
  name: string;
  email: string;
  farmName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  region: string;
  province: string;
  municipality: string;
  qualityRating: number;
  serviceRating: number;
  reviewCount: number;
  createdAt: string;
}

export interface AddressTemplate {
  id: string;
  label: string;
  fullName: string;
  phoneNumber: string;
  region: string;
  province: string;
  municipality: string;
  detailedAddress: string;
  isDefault: boolean;
  createdAt: string;
}

export interface Listing {
  id: string;
  dealerId: string;
  dealerName: string;
  farmName: string;
  dealerAvatarUrl?: string | null;
  dealerQualityRating?: number;
  dealerServiceRating?: number;
  dealerReviewCount?: number;
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
  preferredDate?: string | null;
  status: OfferStatus;
  createdAt: string;
  dealerNotes?: string | null;
  scheduledPickupWindow?: string | null;
  deliveryFee?: number | null;
  completedAt?: string | null;
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
  type: 'offer_received' | 'offer_approved' | 'offer_rejected' | 'offer_completed' | 'dealer_reminder';
  title: string;
  message: string;
  offerId?: string | null;
  read: boolean;
  createdAt: string;
}

// ---- Database row types (snake_case from Supabase) ----

export interface ProfileRow {
  id: string;
  account_type: AccountType;
  name: string;
  email: string;
  farm_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  region: string;
  province: string;
  municipality: string;
  quality_rating: number;
  service_rating: number;
  review_count: number;
  created_at: string;
}

export interface AddressTemplateRow {
  id: string;
  user_id: string;
  label: string;
  full_name: string;
  phone_number: string;
  region: string;
  province: string;
  municipality: string;
  detailed_address: string;
  is_default: boolean;
  created_at: string;
}

export interface ListingRow {
  id: string;
  dealer_id: string;
  title: string;
  category: string;
  batch_number: string;
  price_per_head: number;
  available_stock: number;
  original_stock: number;
  region: string;
  province: string;
  municipality: string;
  description: string;
  image_url: string;
  is_active: boolean;
  created_at: string;
}

export interface OfferRow {
  id: string;
  listing_id: string;
  dealer_id: string;
  buyer_id: string;
  buyer_name: string;
  buyer_contact: string;
  quantity: number;
  fulfillment_method: FulfillmentMethod;
  preferred_date: string | null;
  delivery_fee: number | null;
  delivery_address: string | null;
  dealer_notes: string | null;
  scheduled_pickup_window: string | null;
  status: OfferStatus;
  rated: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface ReviewRow {
  id: string;
  offer_id: string;
  dealer_id: string;
  quality_rating: number;
  service_rating: number;
  comment: string;
  buyer_name: string;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: 'offer_received' | 'offer_approved' | 'offer_rejected' | 'offer_completed' | 'dealer_reminder';
  title: string;
  message: string;
  offer_id: string | null;
  read: boolean;
  created_at: string;
}

// ---- Mappers (snake_case DB row -> camelCase app type) ----

export function mapProfile(r: ProfileRow): Profile {
  return {
    id: r.id,
    accountType: r.account_type,
    name: r.name,
    email: r.email,
    farmName: r.farm_name,
    phone: r.phone,
    avatarUrl: r.avatar_url,
    region: r.region,
    province: r.province,
    municipality: r.municipality,
    qualityRating: Number(r.quality_rating),
    serviceRating: Number(r.service_rating),
    reviewCount: r.review_count,
    createdAt: r.created_at,
  };
}

export function mapAddressTemplate(r: AddressTemplateRow): AddressTemplate {
  return {
    id: r.id,
    label: r.label,
    fullName: r.full_name,
    phoneNumber: r.phone_number,
    region: r.region,
    province: r.province,
    municipality: r.municipality,
    detailedAddress: r.detailed_address,
    isDefault: r.is_default,
    createdAt: r.created_at,
  };
}

export function mapListing(
  r: ListingRow,
  dealerName: string,
  farmName: string,
  dealer?: { avatarUrl?: string | null; qualityRating?: number; serviceRating?: number; reviewCount?: number }
): Listing {
  return {
    id: r.id,
    dealerId: r.dealer_id,
    dealerName,
    farmName,
    dealerAvatarUrl: dealer?.avatarUrl,
    dealerQualityRating: dealer?.qualityRating,
    dealerServiceRating: dealer?.serviceRating,
    dealerReviewCount: dealer?.reviewCount,
    title: r.title,
    category: r.category,
    batchNumber: r.batch_number,
    pricePerHead: r.price_per_head,
    availableStock: r.available_stock,
    originalStock: r.original_stock,
    region: r.region,
    province: r.province,
    municipality: r.municipality,
    description: r.description,
    imageUrl: r.image_url,
    isActive: r.is_active,
    createdAt: r.created_at,
  };
}

export function mapOffer(r: OfferRow): Offer {
  return {
    id: r.id,
    listingId: r.listing_id,
    dealerId: r.dealer_id,
    buyerId: r.buyer_id,
    buyerName: r.buyer_name,
    buyerContact: r.buyer_contact,
    quantity: r.quantity,
    fulfillmentMethod: r.fulfillment_method,
    preferredDate: r.preferred_date,
    deliveryFee: r.delivery_fee,
    deliveryAddress: r.delivery_address,
    dealerNotes: r.dealer_notes,
    scheduledPickupWindow: r.scheduled_pickup_window,
    status: r.status,
    rated: r.rated,
    completedAt: r.completed_at,
    createdAt: r.created_at,
  };
}

export function mapReview(r: ReviewRow): Review {
  return {
    id: r.id,
    offerId: r.offer_id,
    dealerId: r.dealer_id,
    qualityRating: r.quality_rating,
    serviceRating: r.service_rating,
    comment: r.comment,
    buyerName: r.buyer_name,
    createdAt: r.created_at,
  };
}

export function mapNotification(r: NotificationRow): AppNotification {
  return {
    id: r.id,
    userId: r.user_id,
    type: r.type,
    title: r.title,
    message: r.message,
    offerId: r.offer_id,
    read: r.read,
    createdAt: r.created_at,
  };
}
