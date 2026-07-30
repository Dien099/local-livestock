import { useState, useEffect } from 'react';
import { X, Check, Truck, Calendar, AlertCircle } from 'lucide-react';
import type { Offer, Listing, User } from '@/types';
import { useApp } from '@/context/AppContext';

interface ApprovalModalProps {
  offer: Offer | null;
  listing: Listing | null;
  dealer: User | null;
  onClose: () => void;
}

export default function ApprovalModal({ offer, listing, dealer, onClose }: ApprovalModalProps) {
  const { dispatch } = useApp();
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [dealerNotes, setDealerNotes] = useState('');
  const [pickupWindow, setPickupWindow] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('0');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (offer) {
      setAction(null);
      setDealerNotes('');
      setPickupWindow('');
      setDeliveryFee(String(offer.deliveryFee || 0));
      setDone(false);
    }
  }, [offer]);

  if (!offer || !listing || !dealer) return null;

  const handleApprove = () => {
    dispatch({
      type: 'APPROVE_OFFER',
      payload: {
        offerId: offer.id,
        dealerNotes,
        scheduledPickupWindow: offer.fulfillmentMethod === 'pickup' ? pickupWindow : undefined,
        deliveryFee: offer.fulfillmentMethod === 'delivery' ? (parseInt(deliveryFee) || 0) : undefined,
      },
    });
    dispatch({ type: 'COMPLETE_OFFER', payload: offer.id });
    setDone(true);
  };

  const handleReject = () => {
    dispatch({ type: 'REJECT_OFFER', payload: offer.id });
    setDone(true);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="p-8 text-center animate-fade-in">
            <div
              className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4"
              style={{ backgroundColor: action === 'approve' ? 'color-mix(in srgb, var(--success) 15%, transparent)' : 'color-mix(in srgb, var(--error) 15%, transparent)' }}
            >
              {action === 'approve' ? (
                <Check size={32} style={{ color: 'var(--success)' }} />
              ) : (
                <X size={32} style={{ color: 'var(--error)' }} />
              )}
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>
              {action === 'approve' ? 'Offer Approved' : 'Offer Rejected'}
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              {action === 'approve'
                ? `Stock counter updated. ${offer.quantity} ${listing.title.toLowerCase()}(s) deducted from batch ${listing.batchNumber}.`
                : 'The buyer has been notified that their offer was declined.'}
            </p>
            <button onClick={onClose} className="btn-primary w-full">Done</button>
          </div>
        ) : (
          <>
            <div className="sticky top-0 flex items-center justify-between p-4 border-b" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Review Offer</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-5">
              {/* Listing summary */}
              <div className="flex gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg)' }}>
                <img src={listing.imageUrl} alt={listing.title} className="w-20 h-20 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>{listing.title}</h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Batch {listing.batchNumber}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Available: <span className="font-semibold" style={{ color: 'var(--text)' }}>{listing.availableStock}</span> / {listing.originalStock}
                  </p>
                </div>
              </div>

              {/* Buyer info */}
              <div className="space-y-2 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg)' }}>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Buyer Details</h3>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Name</span>
                  <span className="font-semibold" style={{ color: 'var(--text)' }}>{offer.buyerName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Contact</span>
                  <span className="font-semibold" style={{ color: 'var(--text)' }}>{offer.buyerContact}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Quantity</span>
                  <span className="font-semibold" style={{ color: 'var(--text)' }}>{offer.quantity} head</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Total</span>
                  <span className="font-bold" style={{ color: 'var(--primary)' }}>
                    ₱{(listing.pricePerHead * offer.quantity + (offer.deliveryFee || 0)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Fulfillment</span>
                  <span className="font-semibold flex items-center gap-1" style={{ color: 'var(--text)' }}>
                    {offer.fulfillmentMethod === 'pickup' ? <Calendar size={13} /> : <Truck size={13} />}
                    {offer.fulfillmentMethod === 'pickup' ? 'Pickup' : 'Delivery'}
                  </span>
                </div>
                {offer.preferredDate && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>Preferred Date</span>
                    <span className="font-semibold" style={{ color: 'var(--text)' }}>{offer.preferredDate}</span>
                  </div>
                )}
              </div>

              {/* Stock check */}
              {offer.quantity > listing.availableStock && (
                <div className="p-3 rounded-lg flex items-center gap-2 text-xs" style={{ backgroundColor: 'color-mix(in srgb, var(--error) 10%, transparent)', color: 'var(--error)' }}>
                  <AlertCircle size={16} />
                  Requested quantity exceeds available stock. Approval will set stock to 0.
                </div>
              )}

              {/* Conditional fields on approve */}
              {action === 'approve' && (
                <div className="space-y-4 animate-fade-in">
                  {offer.fulfillmentMethod === 'pickup' && (
                    <div>
                      <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                        Pickup Window (e.g. "Aug 19, 06:00-08:00")
                      </label>
                      <input
                        type="text"
                        value={pickupWindow}
                        onChange={(e) => setPickupWindow(e.target.value)}
                        placeholder="Schedule a pickup window"
                        className="input-field"
                      />
                    </div>
                  )}
                  {offer.fulfillmentMethod === 'delivery' && (
                    <div>
                      <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                        Confirmed Delivery Fee (₱)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={deliveryFee}
                        onChange={(e) => setDeliveryFee(e.target.value)}
                        onBlur={() => { if (deliveryFee === '' || (parseInt(deliveryFee) || 0) < 0) setDeliveryFee('0'); }}
                        className="input-field"
                        placeholder="0"
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                      Notes for Buyer (optional)
                    </label>
                    <textarea
                      value={dealerNotes}
                      onChange={(e) => setDealerNotes(e.target.value)}
                      placeholder="Add instructions or comments..."
                      rows={2}
                      className="input-field resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {action === null ? (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setAction('approve')}
                    className="py-3 rounded-lg font-semibold text-sm text-white transition-all active:scale-95"
                    style={{ backgroundColor: 'var(--success)' }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setAction('reject')}
                    className="py-3 rounded-lg font-semibold text-sm text-white transition-all active:scale-95"
                    style={{ backgroundColor: 'var(--error)' }}
                  >
                    Reject
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text)' }}>
                    {action === 'approve' ? <Check size={16} style={{ color: 'var(--success)' }} /> : <X size={16} style={{ color: 'var(--error)' }} />}
                    {action === 'approve' ? 'Confirm approval — stock will be deducted.' : 'Confirm rejection — buyer will be notified.'}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setAction(null)} className="btn-ghost py-3">
                      Back
                    </button>
                    {action === 'approve' ? (
                      <button onClick={handleApprove} className="py-3 rounded-lg font-semibold text-sm text-white transition-all active:scale-95" style={{ backgroundColor: 'var(--success)' }}>
                        Confirm Approve
                      </button>
                    ) : (
                      <button onClick={handleReject} className="py-3 rounded-lg font-semibold text-sm text-white transition-all active:scale-95" style={{ backgroundColor: 'var(--error)' }}>
                        Confirm Reject
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
