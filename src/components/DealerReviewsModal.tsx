import { useState, useEffect } from 'react';
import { X, Star, MessageSquare, Loader2, Store, MapPin } from 'lucide-react';
import type { Review } from '@/types';
import { useApp } from '@/context/AppContext';
import StarRating from '@/components/StarRating';

interface DealerReviewsModalProps {
  dealerId: string | null;
  dealerName: string;
  farmName?: string | null;
  avatarUrl?: string | null;
  onClose: () => void;
}

export default function DealerReviewsModal({
  dealerId, dealerName, farmName, avatarUrl, onClose,
}: DealerReviewsModalProps) {
  const { reviews } = useApp();
  const [dealerReviews, setDealerReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (dealerId) {
      setLoading(true);
      const filtered = reviews.filter((r) => r.dealerId === dealerId);
      setDealerReviews(filtered);
      setLoading(false);
    }
  }, [dealerId, reviews]);

  if (!dealerId) return null;

  const avgQuality = dealerReviews.length > 0
    ? dealerReviews.reduce((s, r) => s + r.qualityRating, 0) / dealerReviews.length
    : 0;
  const avgService = dealerReviews.length > 0
    ? dealerReviews.reduce((s, r) => s + r.serviceRating, 0) / dealerReviews.length
    : 0;
  const overall = (avgQuality + avgService) / 2;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between p-4 border-b" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Dealer Reviews</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* Dealer header */}
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg)' }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={dealerName} className="w-14 h-14 rounded-xl object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
                {dealerName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>{farmName || dealerName}</h3>
              <div className="flex items-center gap-1.5 mt-1">
                <StarRating value={overall} size={14} />
                <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>{overall.toFixed(1)}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>· {dealerReviews.length} review{dealerReviews.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          {/* Rating breakdown */}
          {dealerReviews.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="card p-3 text-center">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Quality</span>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Star size={14} className="fill-current" style={{ color: 'var(--accent)' }} />
                  <span className="font-bold text-lg" style={{ color: 'var(--text)' }}>{avgQuality.toFixed(1)}</span>
                </div>
              </div>
              <div className="card p-3 text-center">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Service</span>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Star size={14} className="fill-current" style={{ color: 'var(--accent)' }} />
                  <span className="font-bold text-lg" style={{ color: 'var(--text)' }}>{avgService.toFixed(1)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Reviews list */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
            </div>
          ) : dealerReviews.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare size={32} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No reviews yet for this dealer.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dealerReviews.map((review) => (
                <div key={review.id} className="pb-4 border-b last:border-0 last:pb-0" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{review.buyerName}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-4 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Quality</span>
                      <StarRating value={review.qualityRating} size={12} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Service</span>
                      <StarRating value={review.serviceRating} size={12} />
                    </div>
                  </div>
                  {review.comment && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{review.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
