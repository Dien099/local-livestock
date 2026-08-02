import { useState } from 'react';
import { ShoppingBag, MapPin, Calendar, Truck, Package, Star, CheckCircle2, XCircle, Clock } from 'lucide-react';
import type { Offer, Listing, Profile } from '@/types';
import { useApp } from '@/context/AppContext';
import RatingModal from '@/components/RatingModal';
import BackButton from '@/components/BackButton';

interface CustomerOffersProps {
  onBack: () => void;
}

export default function CustomerOffers({ onBack }: CustomerOffersProps) {
  const { listings, myOffers, currentUser } = useApp();
  const [ratingOffer, setRatingOffer] = useState<Offer | null>(null);

  const getListing = (id: string): Listing | undefined => listings.find((l) => l.id === id);
  const getDealer = (id: string): Profile | undefined => {
    const listing = listings.find((l) => l.dealerId === id);
    if (!listing) return undefined;
    return { id, accountType: 'dealer', name: listing.dealerName, email: '', farmName: listing.farmName, region: '', province: '', municipality: '', qualityRating: 0, serviceRating: 0, reviewCount: 0, createdAt: '' };
  };

  const statusBadge = (status: Offer['status']) => {
    const config = {
      PENDING: { class: 'badge-pending', icon: Clock, label: 'Pending' },
      APPROVED: { class: 'badge-approved', icon: CheckCircle2, label: 'Approved' },
      REJECTED: { class: 'badge-rejected', icon: XCircle, label: 'Rejected' },
      COMPLETED: { class: 'badge-completed', icon: CheckCircle2, label: 'Completed' },
    }[status];
    const Icon = config.icon;
    return (
      <span className={config.class}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center gap-3 mb-6">
        <BackButton label="Back to Marketplace" onClick={onBack} />
      </div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: 'var(--text)' }}>My Offers</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Track the status of offers you've submitted to dealers.</p>
      </div>

      {myOffers.length === 0 ? (
        <div className="card p-12 text-center">
          <ShoppingBag size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>You haven't submitted any offers yet. Browse listings to make your first offer.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {myOffers.map((offer) => {
            const listing = getListing(offer.listingId);
            const dealer = getDealer(offer.dealerId);
            if (!listing) return null;

            return (
              <div key={offer.id} className="card p-4 animate-slide-up">
                <div className="flex flex-col sm:flex-row gap-4">
                  <img src={listing.imageUrl} alt={listing.title} className="w-full sm:w-24 h-24 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-bold text-base" style={{ color: 'var(--text)' }}>{listing.title}</h3>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Batch {listing.batchNumber}
                          {dealer ? ` · ${dealer.farmName || dealer.name}` : ''}
                        </p>
                      </div>
                      {statusBadge(offer.status)}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mt-3">
                      <div>
                        <span className="block" style={{ color: 'var(--text-muted)' }}>Quantity</span>
                        <span className="font-semibold flex items-center gap-1" style={{ color: 'var(--text)' }}>
                          <Package size={12} /> {offer.quantity}
                        </span>
                      </div>
                      <div>
                        <span className="block" style={{ color: 'var(--text-muted)' }}>Total</span>
                        <span className="font-semibold" style={{ color: 'var(--text)' }}>
                          ₱{(listing.pricePerHead * offer.quantity + (offer.deliveryFee || 0)).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="block" style={{ color: 'var(--text-muted)' }}>Fulfillment</span>
                        <span className="font-semibold flex items-center gap-1" style={{ color: 'var(--text)' }}>
                          {offer.fulfillmentMethod === 'pickup' ? <Calendar size={12} /> : <Truck size={12} />}
                          {offer.fulfillmentMethod === 'pickup' ? 'Pickup' : 'Delivery'}
                        </span>
                      </div>
                      <div>
                        <span className="block" style={{ color: 'var(--text-muted)' }}>Location</span>
                        <span className="font-semibold flex items-center gap-1" style={{ color: 'var(--text)' }}>
                          <MapPin size={12} /> {listing.municipality}
                        </span>
                      </div>
                    </div>

                    {offer.status === 'COMPLETED' && offer.scheduledPickupWindow && (
                      <div className="mt-3 p-2 rounded-lg text-xs" style={{ backgroundColor: 'color-mix(in srgb, var(--success) 10%, transparent)', color: 'var(--text)' }}>
                        <strong>Pickup scheduled:</strong> {offer.scheduledPickupWindow}
                        {offer.dealerNotes && <div className="mt-1" style={{ color: 'var(--text-muted)' }}>Note: {offer.dealerNotes}</div>}
                      </div>
                    )}
                    {offer.status === 'COMPLETED' && offer.deliveryFee !== undefined && offer.deliveryFee !== null && (
                      <div className="mt-3 p-2 rounded-lg text-xs" style={{ backgroundColor: 'color-mix(in srgb, var(--success) 10%, transparent)', color: 'var(--text)' }}>
                        <strong>Delivery approved:</strong> Fee ₱{offer.deliveryFee.toLocaleString()}
                        {offer.dealerNotes && <div className="mt-1" style={{ color: 'var(--text-muted)' }}>Note: {offer.dealerNotes}</div>}
                      </div>
                    )}
                    {offer.status === 'REJECTED' && (
                      <div className="mt-3 p-2 rounded-lg text-xs" style={{ backgroundColor: 'color-mix(in srgb, var(--error) 10%, transparent)', color: 'var(--text)' }}>
                        Your offer was declined by the dealer.
                      </div>
                    )}

                    {offer.status === 'COMPLETED' && (
                      <div className="mt-3 flex items-center gap-2">
                        {offer.rated ? (
                          <span className="text-xs flex items-center gap-1" style={{ color: 'var(--success)' }}>
                            <Star size={14} className="fill-current" style={{ color: 'var(--accent)' }} /> Reviewed
                          </span>
                        ) : (
                          <button onClick={() => setRatingOffer(offer)} className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5 min-h-[36px]">
                            <Star size={14} style={{ color: 'var(--accent)' }} /> Rate this dealer
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <RatingModal
        offer={ratingOffer}
        listing={ratingOffer ? getListing(ratingOffer.listingId) ?? null : null}
        dealer={ratingOffer ? getDealer(ratingOffer.dealerId) ?? null : null}
        onClose={() => setRatingOffer(null)}
      />
    </div>
  );
}
