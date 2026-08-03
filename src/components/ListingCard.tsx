import type { Listing } from '@/types';
import { MapPin, TrendingDown, Package, Star } from 'lucide-react';
import StarRating from '@/components/StarRating';

interface ListingCardProps {
  listing: Listing;
  onClick: () => void;
  onDealerClick?: () => void;
}

export default function ListingCard({ listing, onClick, onDealerClick }: ListingCardProps) {
  const stockPercent = listing.originalStock > 0 ? (listing.availableStock / listing.originalStock) * 100 : 0;
  const isLowStock = listing.availableStock <= 50;
  const avgRating = listing.dealerReviewCount && listing.dealerReviewCount > 0
    ? ((listing.dealerQualityRating ?? 0) + (listing.dealerServiceRating ?? 0)) / 2
    : null;

  return (
    <button
      onClick={onClick}
      className="card overflow-hidden text-left group flex flex-col animate-slide-up"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={listing.imageUrl}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <span
            className="px-2.5 py-1 rounded-full text-xs font-semibold text-white shadow-sm"
            style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 90%, transparent)' }}
          >
            {listing.category}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span
            className="px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm flex items-center gap-1"
            style={{
              backgroundColor: isLowStock ? 'color-mix(in srgb, var(--error) 90%, transparent)' : 'color-mix(in srgb, var(--surface) 90%, transparent)',
              color: isLowStock ? 'white' : 'var(--text)',
            }}
          >
            <Package size={12} />
            {listing.availableStock} left
          </span>
        </div>
        {listing.availableStock === 0 && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <span className="text-white font-bold text-sm uppercase tracking-wide">Sold Out</span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            Batch {listing.batchNumber}
          </span>
          <h3 className="text-base font-bold leading-tight" style={{ color: 'var(--text)' }}>
            {listing.title}
          </h3>
          <div className="flex items-center gap-1 mt-1">
            <MapPin size={13} style={{ color: 'var(--text-muted)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {listing.municipality}, {listing.province}
            </span>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              <TrendingDown size={12} />
              Stock level
            </span>
            <span className="text-xs font-semibold" style={{ color: stockPercent < 20 ? 'var(--error)' : 'var(--success)' }}>
              {Math.round(stockPercent)}%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${stockPercent}%`,
                backgroundColor: stockPercent < 20 ? 'var(--error)' : 'var(--success)',
              }}
            />
          </div>
        </div>

        {/* Dealer rating row */}
        {avgRating !== null && (
          <div className="flex items-center gap-1.5">
            <StarRating value={avgRating} size={13} />
            <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
              {avgRating.toFixed(1)}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              ({listing.dealerReviewCount} review{listing.dealerReviewCount !== 1 ? 's' : ''})
            </span>
          </div>
        )}

        <div className="flex items-end justify-between pt-1">
          <div>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Price per head</span>
            <div className="text-lg font-bold" style={{ color: 'var(--primary)' }}>
              ₱{listing.pricePerHead.toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            {listing.dealerAvatarUrl ? (
              <img
                src={listing.dealerAvatarUrl}
                alt={listing.farmName}
                className="w-8 h-8 rounded-full object-cover border-2"
                style={{ borderColor: 'var(--border)' }}
              />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
                {listing.farmName.charAt(0).toUpperCase()}
              </div>
            )}
            {onDealerClick ? (
              <button
                onClick={(e) => { e.stopPropagation(); onDealerClick(); }}
                className="text-xs mt-0.5 hover:underline flex items-center gap-0.5"
                style={{ color: 'var(--text-muted)' }}
              >
                <Star size={10} className="fill-current" style={{ color: 'var(--accent)' }} />
                {listing.farmName}
              </button>
            ) : (
              <span className="text-xs mt-0.5 block" style={{ color: 'var(--text-muted)' }}>{listing.farmName}</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
