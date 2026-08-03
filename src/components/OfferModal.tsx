import { useState, useEffect } from 'react';
import { X, Calendar, Truck, Package, User, Phone, AlertCircle, Loader2, MapPin, Bookmark, Plus, Check } from 'lucide-react';
import type { Listing, FulfillmentMethod, AddressTemplate } from '@/types';
import { useApp } from '@/context/AppContext';
import StarRating from '@/components/StarRating';

interface OfferModalProps {
  listing: Listing | null;
  onClose: () => void;
}

export default function OfferModal({ listing, onClose }: OfferModalProps) {
  const { submitOffer, currentUser, addressTemplates, saveAddressTemplate } = useApp();
  const [quantity, setQuantity] = useState('1');
  const [fulfillment, setFulfillment] = useState<FulfillmentMethod>('pickup');
  const [preferredDate, setPreferredDate] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerContact, setBuyerContact] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('0');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [tplLabel, setTplLabel] = useState('Home');
  const [tplFullName, setTplFullName] = useState('');
  const [tplPhone, setTplPhone] = useState('');
  const [tplRegion, setTplRegion] = useState('');
  const [tplProvince, setTplProvince] = useState('');
  const [tplMunicipality, setTplMunicipality] = useState('');
  const [tplDetailedAddress, setTplDetailedAddress] = useState('');
  const [tplIsDefault, setTplIsDefault] = useState(false);
  const [tplSaving, setTplSaving] = useState(false);

  useEffect(() => {
    if (listing && currentUser) {
      setQuantity('1');
      setFulfillment('pickup');
      setPreferredDate('');
      setBuyerName(currentUser.name);
      setBuyerContact(currentUser.phone || '');
      setDeliveryFee('0');
      setDeliveryAddress('');
      setErrors({});
      setSubmitted(false);
      setSubmitError('');
      setSelectedTemplateId(null);
      setShowTemplateForm(false);

      // Auto-fill from default template
      const defaultTpl = addressTemplates.find((t) => t.isDefault);
      if (defaultTpl) {
        setSelectedTemplateId(defaultTpl.id);
        setBuyerName(defaultTpl.fullName);
        setBuyerContact(defaultTpl.phoneNumber);
        if (defaultTpl.region || defaultTpl.province || defaultTpl.municipality || defaultTpl.detailedAddress) {
          setDeliveryAddress([
            defaultTpl.detailedAddress,
            defaultTpl.municipality,
            defaultTpl.province,
            defaultTpl.region,
          ].filter(Boolean).join(', '));
        }
      }
    }
  }, [listing, currentUser, addressTemplates]);

  if (!listing) return null;

  const dealer = currentUser && listing.dealerId === currentUser.id ? currentUser : null;
  const qtyNum = parseInt(quantity) || 0;
  const feeNum = parseInt(deliveryFee) || 0;
  const totalPrice = listing.pricePerHead * qtyNum;
  const grandTotal = totalPrice + (fulfillment === 'delivery' ? feeNum : 0);

  const applyTemplate = (tpl: AddressTemplate | null) => {
    if (tpl) {
      setSelectedTemplateId(tpl.id);
      setBuyerName(tpl.fullName);
      setBuyerContact(tpl.phoneNumber);
      setDeliveryAddress([
        tpl.detailedAddress,
        tpl.municipality,
        tpl.province,
        tpl.region,
      ].filter(Boolean).join(', '));
    } else {
      setSelectedTemplateId(null);
    }
  };

  const handleSaveTemplate = async () => {
    if (!tplFullName.trim() || !tplPhone.trim()) return;
    setTplSaving(true);
    await saveAddressTemplate({
      label: tplLabel.trim() || 'Home',
      fullName: tplFullName.trim(),
      phoneNumber: tplPhone.trim(),
      region: tplRegion,
      province: tplProvince,
      municipality: tplMunicipality.trim(),
      detailedAddress: tplDetailedAddress.trim(),
      isDefault: tplIsDefault,
    });
    setTplSaving(false);
    setShowTemplateForm(false);
    setTplLabel('Home');
    setTplFullName('');
    setTplPhone('');
    setTplRegion('');
    setTplProvince('');
    setTplMunicipality('');
    setTplDetailedAddress('');
    setTplIsDefault(false);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!buyerName.trim()) e.buyerName = 'Your name is required';
    if (!buyerContact.trim()) e.buyerContact = 'Contact number is required';
    if (qtyNum < 1) e.quantity = 'Quantity must be at least 1';
    if (qtyNum > listing.availableStock) e.quantity = `Only ${listing.availableStock} available`;
    if (!preferredDate) e.preferredDate = 'Please select a preferred date';
    if (fulfillment === 'delivery' && !deliveryAddress.trim()) e.deliveryAddress = 'Delivery address is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !currentUser) return;
    setSubmitting(true);
    const { error } = await submitOffer({
      listingId: listing.id,
      dealerId: listing.dealerId,
      buyerName,
      buyerContact,
      quantity: qtyNum,
      fulfillmentMethod: fulfillment,
      preferredDate,
      deliveryFee: fulfillment === 'delivery' ? feeNum : undefined,
      deliveryAddress: fulfillment === 'delivery' ? deliveryAddress.trim() : undefined,
    });
    setSubmitting(false);
    if (error) {
      setErrors({ submit: error });
      return;
    }
    setSubmitted(true);
  };

  const avgRating = listing.dealerReviewCount && listing.dealerReviewCount > 0
    ? ((listing.dealerQualityRating ?? 0) + (listing.dealerServiceRating ?? 0)) / 2
    : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        {submitted ? (
          <div className="p-8 text-center animate-fade-in">
            <div
              className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4"
              style={{ backgroundColor: 'color-mix(in srgb, var(--success) 15%, transparent)' }}
            >
              <Package size={32} style={{ color: 'var(--success)' }} />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>Offer Submitted!</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              Your offer for {qtyNum} {listing.title.toLowerCase()}(s) is now pending dealer approval.
              Track its status in "My Offers".
            </p>
            <button onClick={onClose} className="btn-primary w-full">Done</button>
          </div>
        ) : (
          <>
            <div className="sticky top-0 flex items-center justify-between p-4 border-b" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Submit Offer</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-5">
              <div className="flex gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg)' }}>
                <img src={listing.imageUrl} alt={listing.title} className="w-20 h-20 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>{listing.title}</h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Batch {listing.batchNumber}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{listing.farmName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm font-bold" style={{ color: 'var(--primary)' }}>₱{listing.pricePerHead.toLocaleString()}/head</p>
                    {avgRating !== null && (
                      <span className="text-xs flex items-center gap-0.5" style={{ color: 'var(--text-muted)' }}>
                        <StarRating value={avgRating} size={11} />
                        ({listing.dealerReviewCount})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Saved address templates */}
              {addressTemplates.length > 0 && !showTemplateForm && (
                <div>
                  <label className="text-xs font-medium flex items-center gap-1.5 mb-2" style={{ color: 'var(--text-muted)' }}>
                    <Bookmark size={13} /> Saved Address Templates
                  </label>
                  <div className="space-y-2">
                    {addressTemplates.map((tpl) => (
                      <button
                        key={tpl.id}
                        onClick={() => applyTemplate(selectedTemplateId === tpl.id ? null : tpl)}
                        className="w-full p-3 rounded-xl text-left transition-all flex items-start gap-3"
                        style={{
                          border: selectedTemplateId === tpl.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                          backgroundColor: selectedTemplateId === tpl.id ? 'color-mix(in srgb, var(--primary) 6%, transparent)' : 'transparent',
                        }}
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 10%, transparent)' }}>
                          <MapPin size={16} style={{ color: 'var(--primary)' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{tpl.label}</span>
                            {tpl.isDefault && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold text-white" style={{ backgroundColor: 'var(--primary)' }}>
                                DEFAULT
                              </span>
                            )}
                          </div>
                          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{tpl.fullName} · {tpl.phoneNumber}</p>
                          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                            {tpl.detailedAddress}, {tpl.municipality}, {tpl.province}
                          </p>
                        </div>
                        {selectedTemplateId === tpl.id && (
                          <Check size={18} style={{ color: 'var(--primary)' }} className="flex-shrink-0 mt-1" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Save new template toggle */}
              {!showTemplateForm && (
                <button
                  onClick={() => setShowTemplateForm(true)}
                  className="btn-ghost w-full py-2.5 flex items-center justify-center gap-2 text-sm"
                >
                  <Plus size={16} /> Save New Address Template
                </button>
              )}

              {/* New template form */}
              {showTemplateForm && (
                <div className="p-3 rounded-xl space-y-3 animate-fade-in" style={{ backgroundColor: 'var(--bg)' }}>
                  <h3 className="text-sm font-semibold flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                    <Bookmark size={14} /> New Address Template
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Label</label>
                      <input type="text" value={tplLabel} onChange={(e) => setTplLabel(e.target.value)} placeholder="Home" className="input-field" />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Full Name</label>
                      <input type="text" value={tplFullName} onChange={(e) => setTplFullName(e.target.value)} placeholder="Juan dela Cruz" className="input-field" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Phone Number</label>
                    <input type="tel" value={tplPhone} onChange={(e) => setTplPhone(e.target.value)} placeholder="+63 9XX XXX XXXX" className="input-field" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Region</label>
                      <input type="text" value={tplRegion} onChange={(e) => setTplRegion(e.target.value)} placeholder="Region IV-A" className="input-field" />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Province</label>
                      <input type="text" value={tplProvince} onChange={(e) => setTplProvince(e.target.value)} placeholder="Cavite" className="input-field" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Barangay / Municipality</label>
                    <input type="text" value={tplMunicipality} onChange={(e) => setTplMunicipality(e.target.value)} placeholder="Trece Martires" className="input-field" />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Detailed Address (Street, House No.)</label>
                    <input type="text" value={tplDetailedAddress} onChange={(e) => setTplDetailedAddress(e.target.value)} placeholder="Block 12 Lot 5, San Agustin" className="input-field" />
                  </div>
                  <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text)' }}>
                    <input type="checkbox" checked={tplIsDefault} onChange={(e) => setTplIsDefault(e.target.checked)} className="w-4 h-4 rounded" />
                    Set as default address
                  </label>
                  <div className="flex gap-2">
                    <button onClick={() => setShowTemplateForm(false)} className="btn-ghost py-2 flex-1 text-sm">Cancel</button>
                    <button onClick={handleSaveTemplate} disabled={!tplFullName.trim() || !tplPhone.trim() || tplSaving} className="btn-primary py-2 flex-1 text-sm disabled:opacity-50 flex items-center justify-center gap-1">
                      {tplSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save Template
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Buyer Details</h3>
                <div>
                  <label className="text-xs font-medium flex items-center gap-1.5 mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    <User size={13} /> Full Name
                  </label>
                  <input
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Enter your name"
                    className="input-field"
                  />
                  {errors.buyerName && <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--error)' }}><AlertCircle size={12} />{errors.buyerName}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium flex items-center gap-1.5 mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    <Phone size={13} /> Contact Number
                  </label>
                  <input
                    type="tel"
                    value={buyerContact}
                    onChange={(e) => setBuyerContact(e.target.value)}
                    placeholder="+63 9XX XXX XXXX"
                    className="input-field"
                  />
                  {errors.buyerContact && <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--error)' }}><AlertCircle size={12} />{errors.buyerContact}</p>}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                  Quantity (max {listing.availableStock})
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(String(Math.max(1, qtyNum - 1)))}
                    className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg min-h-[44px] min-w-[44px]"
                    style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={listing.availableStock}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    onBlur={() => { if (quantity === '' || qtyNum < 1) setQuantity('1'); if (qtyNum > listing.availableStock) setQuantity(String(listing.availableStock)); }}
                    className="input-field text-center font-semibold"
                    placeholder="1"
                  />
                  <button
                    onClick={() => setQuantity(String(Math.min(listing.availableStock, qtyNum + 1)))}
                    className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg min-h-[44px] min-w-[44px]"
                    style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
                  >
                    +
                  </button>
                </div>
                {errors.quantity && <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--error)' }}><AlertCircle size={12} />{errors.quantity}</p>}
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>Fulfillment Method</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setFulfillment('pickup')}
                    className="p-3 rounded-xl text-left transition-all duration-200"
                    style={{
                      border: fulfillment === 'pickup' ? '2px solid var(--primary)' : '1px solid var(--border)',
                      backgroundColor: fulfillment === 'pickup' ? 'color-mix(in srgb, var(--primary) 8%, transparent)' : 'transparent',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${fulfillment === 'pickup' ? 'border-current' : ''}`} style={fulfillment === 'pickup' ? { color: 'var(--primary)' } : { borderColor: 'var(--border)' }}>
                        {fulfillment === 'pickup' && <div className="w-1.5 h-1.5 rounded-full bg-current" style={{ color: 'var(--primary)' }} />}
                      </div>
                      <Calendar size={16} style={{ color: 'var(--text)' }} />
                      <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Pickup</span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Schedule a pickup window at the farm</p>
                  </button>
                  <button
                    onClick={() => setFulfillment('delivery')}
                    className="p-3 rounded-xl text-left transition-all duration-200"
                    style={{
                      border: fulfillment === 'delivery' ? '2px solid var(--primary)' : '1px solid var(--border)',
                      backgroundColor: fulfillment === 'delivery' ? 'color-mix(in srgb, var(--primary) 8%, transparent)' : 'transparent',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${fulfillment === 'delivery' ? 'border-current' : ''}`} style={fulfillment === 'delivery' ? { color: 'var(--primary)' } : { borderColor: 'var(--border)' }}>
                        {fulfillment === 'delivery' && <div className="w-1.5 h-1.5 rounded-full bg-current" style={{ color: 'var(--primary)' }} />}
                      </div>
                      <Truck size={16} style={{ color: 'var(--text)' }} />
                      <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Delivery</span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Request delivery with a fee</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium flex items-center gap-1.5 mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  <Calendar size={13} /> Preferred Date
                </label>
                <input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="input-field"
                />
                {errors.preferredDate && <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--error)' }}><AlertCircle size={12} />{errors.preferredDate}</p>}
              </div>

              {fulfillment === 'delivery' && (
                <div className="animate-fade-in space-y-3">
                  <div>
                    <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                      Offered Delivery Fee (P)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(e.target.value)}
                      onBlur={() => { if (deliveryFee === '') setDeliveryFee('0'); }}
                      className="input-field"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                      Delivery Address
                    </label>
                    <textarea
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Enter full delivery address..."
                      rows={2}
                      className="input-field resize-none"
                    />
                    {errors.deliveryAddress && <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--error)' }}><AlertCircle size={12} />{errors.deliveryAddress}</p>}
                  </div>
                </div>
              )}

              <div className="p-3 rounded-xl space-y-2" style={{ backgroundColor: 'var(--bg)' }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Subtotal ({qtyNum} x P{listing.pricePerHead.toLocaleString()})</span>
                  <span className="font-semibold" style={{ color: 'var(--text)' }}>P{totalPrice.toLocaleString()}</span>
                </div>
                {fulfillment === 'delivery' && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>Delivery Fee</span>
                    <span className="font-semibold" style={{ color: 'var(--text)' }}>P{feeNum.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                  <span className="font-bold" style={{ color: 'var(--text)' }}>Total</span>
                  <span className="font-bold text-lg" style={{ color: 'var(--primary)' }}>P{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {dealer && dealer.reviewCount > 0 && (
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span>Dealer rating:</span>
                  <StarRating value={(dealer.qualityRating + dealer.serviceRating) / 2} size={12} />
                  <span>({dealer.reviewCount} reviews)</span>
                </div>
              )}

              {errors.submit && <p className="text-xs flex items-center gap-1" style={{ color: 'var(--error)' }}><AlertCircle size={12} />{errors.submit}</p>}
              <button onClick={handleSubmit} disabled={submitting} className="btn-primary w-full py-3 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
                Submit Offer
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
