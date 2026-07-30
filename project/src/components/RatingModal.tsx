import { useState, useEffect } from 'react';
import { X, Star } from 'lucide-react';
import type { Offer, Listing, User } from '@/types';
import { useApp } from '@/context/AppContext';
import StarRating from '@/components/StarRating';

interface RatingModalProps {
  offer: Offer | null;
  listing: Listing | null;
  dealer: User | null;
  onClose: () => void;
}

export default function RatingModal({ offer, listing, dealer, onClose }: RatingModalProps) {
  const { dispatch } = useApp();
  const [qualityRating, setQualityRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (offer) {
      setQualityRating(0);
      setServiceRating(0);
      setComment('');
      setSubmitted(false);
    }
  }, [offer]);

  if (!offer || !listing || !dealer) return null;

  const handleSubmit = () => {
    if (qualityRating === 0 || serviceRating === 0) return;
    dispatch({
      type: 'SUBMIT_REVIEW',
      payload: {
        offerId: offer.id,
        dealerId: dealer.id,
        qualityRating,
        serviceRating,
        comment,
        buyerName: offer.buyerName,
      },
    });
    setSubmitted(true);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        {submitted ? (
          <div className="p-8 text-center animate-fade-in">
            <div
              className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4"
              style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}
            >
              <Star size={32} style={{ color: 'var(--accent)' }} />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>Thank You!</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              Your review has been submitted and {dealer.farmName}'s rating has been updated.
            </p>
            <button onClick={onClose} className="btn-primary w-full">Done</button>
          </div>
        ) : (
          <>
            <div className="sticky top-0 flex items-center justify-between p-4 border-b" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Rate Your Experience</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-5">
              <div className="flex gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg)' }}>
                <img src={listing.imageUrl} alt={listing.title} className="w-16 h-16 rounded-lg object-cover" />
                <div>
                  <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>{listing.title}</h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{dealer.farmName}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{quantityText(offer.quantity, listing.title)}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block" style={{ color: 'var(--text)' }}>
                  Livestock Quality
                </label>
                <div className="flex items-center gap-3">
                  <StarRating value={qualityRating} size={28} interactive onChange={setQualityRating} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                    {qualityRating > 0 ? `${qualityRating}.0` : '—'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block" style={{ color: 'var(--text)' }}>
                  Dealer Service
                </label>
                <div className="flex items-center gap-3">
                  <StarRating value={serviceRating} size={28} interactive onChange={setServiceRating} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                    {serviceRating > 0 ? `${serviceRating}.0` : '—'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block" style={{ color: 'var(--text)' }}>
                  Comment (optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience..."
                  rows={3}
                  className="input-field resize-none"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={qualityRating === 0 || serviceRating === 0}
                className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Review
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function quantityText(q: number, type: string): string {
  return `${q} ${type.toLowerCase()}${q > 1 ? 's' : ''}`;
}
