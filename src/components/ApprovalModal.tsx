import { useState, useEffect } from 'react';
import { X, Check, Truck, Calendar, AlertCircle, Loader2, User as UserIcon, Phone, MapPin, Mail, Send } from 'lucide-react';
import type { Offer, Listing, Profile } from '@/types';
import { useApp } from '@/context/AppContext';

interface ApprovalModalProps {
  offer: Offer | null;
  listing: Listing | null;
  dealer: { id: string; farmName?: string | null } | null;
  onClose: () => void;
}

export default function ApprovalModal({ offer, listing, dealer, onClose }: ApprovalModalProps) {
  const { approveOffer, rejectOffer, getBuyerProfile, sendDealerReminder } = useApp();
  const [action, setAction] = useState<'approve' | 'reject' | 'reminder' | null>(null);
  const [dealerNotes, setDealerNotes] = useState('');
  const [pickupWindow, setPickupWindow] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('0');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [buyerProfile, setBuyerProfile] = useState<Profile | null>(null);
  const [reminderMessage, setReminderMessage] = useState('');
  const [reminderSent, setReminderSent] = useState(false);

  useEffect(() => {
    if (offer) {
      setAction(null);
      setDealerNotes('');
      setPickupWindow('');
      setDeliveryFee(String(offer.deliveryFee || 0));
      setDone(false);
      setErrorMsg('');
      setReminderMessage('');
      setReminderSent(false);
      setBuyerProfile(null);
      getBuyerProfile(offer.buyerId).then(setBuyerProfile).catch(() => setBuyerProfile(null));
    }
  }, [offer, getBuyerProfile]);

  if (!offer || !listing || !dealer) return null;

  const handleApprove = async () => {
    setBusy(true);
    setErrorMsg('');
    const { error } = await approveOffer({
      offerId: offer.id,
      dealerNotes,
      scheduledPickupWindow: offer.fulfillmentMethod === 'pickup' ? pickupWindow : undefined,
      deliveryFee: offer.fulfillmentMethod === 'delivery' ? (parseInt(deliveryFee) || 0) : undefined,
    });
    setBusy(false);
    if (error) { setErrorMsg(error); setAction(null); return; }
    setDone(true);
  };

  const handleReject = async () => {
    setBusy(true);
    setErrorMsg('');
    const { error } = await rejectOffer(offer.id);
    setBusy(false);
    if (error) { setErrorMsg(error); setAction(null); return; }
    setDone(true);
  };

  const handleSendReminder = async () => {
    if (!reminderMessage.trim()) return;
    setBusy(true);
    setErrorMsg('');
    const { error } = await sendDealerReminder(offer.id, reminderMessage.trim());
    setBusy(false);
    if (error) { setErrorMsg(error); return; }
    setReminderSent(true);
    setReminderMessage('');
    setTimeout(() => {
      setAction(null);
      setReminderSent(false);
    }, 2000);
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

              {/* Buyer info from offer */}
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
                {offer.deliveryAddress && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>Delivery Address</span>
                    <span className="font-semibold text-right max-w-[60%]" style={{ color: 'var(--text)' }}>{offer.deliveryAddress}</span>
                  </div>
                )}
              </div>

              {/* Buyer profile (from profiles table) */}
              {buyerProfile && (
                <div className="space-y-2 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg)' }}>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Buyer Profile</h3>
                  <div className="flex items-center gap-3 mb-2">
                    {buyerProfile.avatarUrl ? (
                      <img src={buyerProfile.avatarUrl} alt={buyerProfile.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
                        {buyerProfile.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{buyerProfile.name}</p>
                      {buyerProfile.phone && (
                        <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                          <Phone size={11} /> {buyerProfile.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  {buyerProfile.email && (
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <Mail size={12} /> {buyerProfile.email}
                    </div>
                  )}
                  {buyerProfile.municipality && (
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <MapPin size={12} /> {[buyerProfile.municipality, buyerProfile.province, buyerProfile.region].filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>
              )}

              {/* Stock check */}
              {offer.quantity > listing.availableStock && (
                <div className="p-3 rounded-lg flex items-center gap-2 text-xs" style={{ backgroundColor: 'color-mix(in srgb, var(--error) 10%, transparent)', color: 'var(--error)' }}>
                  <AlertCircle size={16} />
                  Requested quantity exceeds available stock. Approval will set stock to 0.
                </div>
              )}

              {/* Reminder section */}
              {action === 'reminder' && (
                <div className="space-y-3 animate-fade-in">
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Send Reminder to Buyer</h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Send a custom notification (e.g. pickup deadlines, delay notices, weather/holiday alerts).
                  </p>
                  <textarea
                    value={reminderMessage}
                    onChange={(e) => setReminderMessage(e.target.value)}
                    placeholder="e.g. Pickup deadline moved to Aug 20, 6:00 AM due to incoming storm..."
                    rows={3}
                    className="input-field resize-none"
                  />
                  {reminderSent && (
                    <div className="p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'color-mix(in srgb, var(--success) 10%, transparent)', color: 'var(--success)' }}>
                      <Check size={16} /> Reminder sent! The buyer will see it in their notifications.
                    </div>
                  )}
                  {errorMsg && (
                    <div className="p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'color-mix(in srgb, var(--error) 10%, transparent)', color: 'var(--error)' }}>
                      <AlertCircle size={16} /> {errorMsg}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => setAction(null)} className="btn-ghost py-2.5 flex-1">Cancel</button>
                    <button
                      onClick={handleSendReminder}
                      disabled={!reminderMessage.trim() || busy}
                      className="btn-primary py-2.5 flex-1 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      Send
                    </button>
                  </div>
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
                  {errorMsg && (
                    <div className="p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'color-mix(in srgb, var(--error) 10%, transparent)', color: 'var(--error)' }}>
                      <AlertCircle size={16} /> {errorMsg}
                    </div>
                  )}
                </div>
              )}

              {/* Action buttons */}
              {action === null ? (
                <div className="space-y-3">
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
                  <button
                    onClick={() => setAction('reminder')}
                    className="btn-ghost w-full py-2.5 flex items-center justify-center gap-2 text-sm"
                  >
                    <Send size={16} /> Send Reminder to Buyer
                  </button>
                </div>
              ) : action !== 'reminder' ? (
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
                      <button onClick={handleApprove} disabled={busy} className="py-3 rounded-lg font-semibold text-sm text-white transition-all active:scale-95 disabled:opacity-60" style={{ backgroundColor: 'var(--success)' }}>
                        {busy ? 'Processing...' : 'Confirm Approve'}
                      </button>
                    ) : (
                      <button onClick={handleReject} disabled={busy} className="py-3 rounded-lg font-semibold text-sm text-white transition-all active:scale-95 disabled:opacity-60" style={{ backgroundColor: 'var(--error)' }}>
                        {busy ? 'Processing...' : 'Confirm Reject'}
                      </button>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
