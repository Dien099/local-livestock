import { useState } from 'react';
import { ShoppingBag, User as UserIcon, Phone, Package, Calendar, Truck, CheckCircle2, XCircle, Clock, Star } from 'lucide-react';
import type { Offer, Listing } from '@/types';
import type { User as UserType } from '@/types';
import { useApp } from '@/context/AppContext';
import ApprovalModal from '@/components/ApprovalModal';
import BackButton from '@/components/BackButton';

type FilterTab = 'pending' | 'approved' | 'completed' | 'rejected';

interface DealerIncomingProps {
  onBack: () => void;
}

export default function DealerIncoming({ onBack }: DealerIncomingProps) {
  const { state, currentUser } = useApp();
  const [filter, setFilter] = useState<FilterTab>('pending');
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  const myOffers = state.offers.filter((o) => o.dealerId === currentUser?.id);
  const filtered = myOffers.filter((o) => o.status.toLowerCase() === filter);

  const getListing = (id: string): Listing | undefined => state.listings.find((l) => l.id === id);
  const getDealer = (id: string): UserType | undefined => state.users.find((u) => u.id === id);

  const counts = {
    pending: myOffers.filter((o) => o.status === 'PENDING').length,
    approved: myOffers.filter((o) => o.status === 'APPROVED').length,
    completed: myOffers.filter((o) => o.status === 'COMPLETED').length,
    rejected: myOffers.filter((o) => o.status === 'REJECTED').length,
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

  const tabs: { id: FilterTab; label: string; count: number }[] = [
    { id: 'pending', label: 'Pending', count: counts.pending },
    { id: 'approved', label: 'Approved', count: counts.approved },
    { id: 'completed', label: 'Completed', count: counts.completed },
    { id: 'rejected', label: 'Rejected', count: counts.rejected },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center gap-3 mb-6">
        <BackButton label="Back to Inventory" onClick={onBack} />
      </div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: 'var(--text)' }}>Incoming Offers</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Review, approve, or reject buyer requests for your listings.</p>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`tab-btn flex items-center gap-2 whitespace-nowrap ${filter === tab.id ? 'active' : ''}`}
          >
            {tab.label}
            <span
              className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
              style={filter === tab.id ? { backgroundColor: 'rgba(255,255,255,0.25)' } : { backgroundColor: 'var(--border)' }}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <ShoppingBag size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No {filter} offers at this time.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((offer) => {
            const listing = getListing(offer.listingId);
            if (!listing) return null;

            return (
              <div key={offer.id} className="card p-4 animate-slide-up">
                <div className="flex flex-col sm:flex-row gap-4">
                  <img src={listing.imageUrl} alt={listing.title} className="w-full sm:w-20 h-20 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-bold text-base" style={{ color: 'var(--text)' }}>{listing.title}</h3>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Batch {listing.batchNumber}</p>
                      </div>
                      {statusBadge(offer.status)}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mt-3">
                      <div>
                        <span className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><UserIcon size={12} /> Buyer</span>
                        <span className="font-semibold" style={{ color: 'var(--text)' }}>{offer.buyerName}</span>
                      </div>
                      <div>
                        <span className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><Phone size={12} /> Contact</span>
                        <span className="font-semibold" style={{ color: 'var(--text)' }}>{offer.buyerContact}</span>
                      </div>
                      <div>
                        <span className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><Package size={12} /> Quantity</span>
                        <span className="font-semibold" style={{ color: 'var(--text)' }}>{offer.quantity} head</span>
                      </div>
                      <div>
                        <span className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                          {offer.fulfillmentMethod === 'pickup' ? <Calendar size={12} /> : <Truck size={12} />} Fulfillment
                        </span>
                        <span className="font-semibold" style={{ color: 'var(--text)' }}>
                          {offer.fulfillmentMethod === 'pickup' ? 'Pickup' : 'Delivery'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                      <div>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Total value</span>
                        <div className="font-bold" style={{ color: 'var(--primary)' }}>
                          ₱{(listing.pricePerHead * offer.quantity + (offer.deliveryFee || 0)).toLocaleString()}
                        </div>
                      </div>
                      {offer.status === 'PENDING' && (
                        <button onClick={() => setSelectedOffer(offer)} className="btn-primary text-sm">
                          Review Offer
                        </button>
                      )}
                      {offer.status === 'APPROVED' && (
                        <div className="text-right text-xs" style={{ color: 'var(--text-muted)' }}>
                          {offer.scheduledPickupWindow && <div>Pickup: {offer.scheduledPickupWindow}</div>}
                          {offer.deliveryFee !== undefined && <div>Delivery fee: ₱{offer.deliveryFee.toLocaleString()}</div>}
                        </div>
                      )}
                      {offer.status === 'COMPLETED' && offer.rated && (
                        <span className="text-xs flex items-center gap-1" style={{ color: 'var(--success)' }}>
                          <Star size={14} className="fill-current" style={{ color: 'var(--accent)' }} /> Rated by buyer
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ApprovalModal
        offer={selectedOffer}
        listing={selectedOffer ? getListing(selectedOffer.listingId) ?? null : null}
        dealer={selectedOffer ? getDealer(selectedOffer.dealerId) ?? null : null}
        onClose={() => setSelectedOffer(null)}
      />
    </div>
  );
}
