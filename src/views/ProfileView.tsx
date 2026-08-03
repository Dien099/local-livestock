import { useState, useRef } from 'react';
import { User as UserIcon, Store, Mail, Phone, MapPin, Star, Edit2, Check, X, ShoppingBag, Package, TrendingDown, Calendar, Camera, Loader2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import RegionProvinceSelector from '@/components/RegionProvinceSelector';
import StarRating from '@/components/StarRating';
import BackButton from '@/components/BackButton';

interface ProfileViewProps {
  onBack: () => void;
  homeLabel: string;
}

export default function ProfileView({ onBack, homeLabel }: ProfileViewProps) {
  const { currentUser, updateProfile, uploadAvatar, reviews, myOffers, listings } = useApp();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name ?? '');
  const [farmName, setFarmName] = useState(currentUser?.farmName ?? '');
  const [phone, setPhone] = useState(currentUser?.phone ?? '');
  const [region, setRegion] = useState(currentUser?.region ?? '');
  const [province, setProvince] = useState(currentUser?.province ?? '');
  const [municipality, setMunicipality] = useState(currentUser?.municipality ?? '');
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!currentUser) return null;

  const isDealer = currentUser.accountType === 'dealer';

  const handleSave = async () => {
    setSaving(true);
    await updateProfile({ name: name.trim(), farmName: farmName.trim() || undefined, phone: phone.trim() || undefined, region, province, municipality: municipality.trim() });
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    setName(currentUser.name);
    setFarmName(currentUser.farmName ?? '');
    setPhone(currentUser.phone ?? '');
    setRegion(currentUser.region);
    setProvince(currentUser.province);
    setMunicipality(currentUser.municipality);
    setEditing(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Image must be under 2MB');
      return;
    }
    setAvatarUploading(true);
    setAvatarError('');
    const { error } = await uploadAvatar(file);
    setAvatarUploading(false);
    if (error) setAvatarError(error);
  };

  const dealerReviews = reviews.filter((r) => r.dealerId === currentUser.id);
  const completedOffers = myOffers.filter((o) => o.status === 'COMPLETED' || o.status === 'APPROVED');
  const myListings = listings.filter((l) => l.dealerId === currentUser.id);
  const totalStock = myListings.reduce((s, l) => s + l.availableStock, 0);
  const totalSold = myListings.reduce((s, l) => s + (l.originalStock - l.availableStock), 0);
  const getListing = (id: string) => listings.find((l) => l.id === id);
  const avgRating = currentUser.reviewCount > 0 ? (currentUser.qualityRating + currentUser.serviceRating) / 2 : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BackButton label={homeLabel} onClick={onBack} />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text)' }}>My Profile</h1>
            <p className="text-sm hidden sm:block" style={{ color: 'var(--text-muted)' }}>Manage your account information and view your activity.</p>
          </div>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="btn-ghost flex items-center gap-2">
            <Edit2 size={16} /> Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={handleCancel} className="btn-ghost flex items-center gap-2 min-h-[44px]" disabled={saving}>
              <X size={16} /> <span className="hidden sm:inline">Cancel</span>
            </button>
            <button onClick={handleSave} className="btn-primary flex items-center gap-2 min-h-[44px]" disabled={saving}>
              <Check size={16} /> <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Profile card */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex flex-col items-center sm:items-start">
            {/* Avatar with upload */}
            <div className="relative group">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-20 h-20 rounded-2xl object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
                style={{ backgroundColor: 'var(--primary)' }}
                aria-label="Upload profile picture"
              >
                {avatarUploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            {avatarError && <p className="text-xs mt-2 text-center max-w-[120px]" style={{ color: 'var(--error)' }}>{avatarError}</p>}
            {isDealer && currentUser.reviewCount > 0 && (
              <div className="mt-3 text-center sm:text-left">
                <StarRating value={avgRating} size={16} />
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{currentUser.reviewCount} review{currentUser.reviewCount !== 1 ? 's' : ''}</p>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            {editing ? (
              <>
                <div>
                  <label className="text-xs font-medium flex items-center gap-1.5 mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    <UserIcon size={13} /> Full Name
                  </label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
                </div>
                {isDealer && (
                  <div>
                    <label className="text-xs font-medium flex items-center gap-1.5 mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      <Store size={13} /> Farm / Store Name
                    </label>
                    <input type="text" value={farmName} onChange={(e) => setFarmName(e.target.value)} className="input-field" />
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium flex items-center gap-1.5 mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    <Phone size={13} /> Phone Number
                  </label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+63 9XX XXX XXXX" className="input-field" />
                </div>
                <RegionProvinceSelector region={region} province={province} onRegionChange={setRegion} onProvinceChange={setProvince} />
                <div>
                  <label className="text-xs font-medium flex items-center gap-1.5 mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    <MapPin size={13} /> Municipality / Barangay / Street
                  </label>
                  <input type="text" value={municipality} onChange={(e) => setMunicipality(e.target.value)} placeholder="e.g. Trece Martires, Brgy. San Agustin" className="input-field" />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>{currentUser.name}</h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: isDealer ? 'var(--secondary)' : 'var(--primary)' }}>
                    {isDealer ? 'Dealer' : 'Buyer'}
                  </span>
                </div>
                {isDealer && currentUser.farmName && (
                  <p className="text-sm flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                    <Store size={14} /> {currentUser.farmName}
                  </p>
                )}
                <p className="text-sm flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                  <Mail size={14} /> {currentUser.email}
                </p>
                {currentUser.phone && (
                  <p className="text-sm flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                    <Phone size={14} /> {currentUser.phone}
                  </p>
                )}
                <p className="text-sm flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                  <MapPin size={14} /> {[currentUser.municipality, currentUser.province, currentUser.region].filter(Boolean).join(', ')}
                </p>
                {isDealer && currentUser.reviewCount > 0 && (
                  <div className="flex gap-4 pt-2">
                    <div>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Quality</span>
                      <div className="flex items-center gap-1">
                        <Star size={14} className="fill-current" style={{ color: 'var(--accent)' }} />
                        <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>{currentUser.qualityRating.toFixed(1)}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Service</span>
                      <div className="flex items-center gap-1">
                        <Star size={14} className="fill-current" style={{ color: 'var(--accent)' }} />
                        <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>{currentUser.serviceRating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      {isDealer ? (
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Package size={16} style={{ color: 'var(--primary)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Total Stock</span>
            </div>
            <span className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{totalStock.toLocaleString()}</span>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown size={16} style={{ color: 'var(--accent)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Sold</span>
            </div>
            <span className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{totalSold.toLocaleString()}</span>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Star size={16} style={{ color: 'var(--accent)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Reviews</span>
            </div>
            <span className="text-2xl font-bold" style={{ qualityRating: 0 }, { color: 'var(--text)' }}>{currentUser.reviewCount}</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingBag size={16} style={{ color: 'var(--primary)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Total Offers</span>
            </div>
            <span className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{myOffers.length}</span>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Package size={16} style={{ color: 'var(--success)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Completed</span>
            </div>
            <span className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{myOffers.filter((o) => o.status === 'COMPLETED').length}</span>
          </div>
        </div>
      )}

      {/* Dealer reviews */}
      {isDealer && dealerReviews.length > 0 && (
        <div className="card p-5">
          <h3 className="text-base font-bold mb-4" style={{ color: 'var(--text)' }}>Customer Reviews</h3>
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
        </div>
      )}

      {/* Buyer transaction history */}
      {!isDealer && completedOffers.length > 0 && (
        <div className="card p-5">
          <h3 className="text-base font-bold mb-4" style={{ color: 'var(--text)' }}>Transaction History</h3>
          <div className="space-y-3">
            {completedOffers.map((offer) => {
              const listing = getListing(offer.listingId);
              if (!listing) return null;
              return (
                <div key={offer.id} className="flex items-center gap-3 pb-3 border-b last:border-0 last:pb-0" style={{ borderColor: 'var(--border)' }}>
                  <img src={listing.imageUrl} alt={listing.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{listing.title}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {offer.quantity} head · ₱{(listing.pricePerHead * offer.quantity + (offer.deliveryFee || 0)).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-semibold" style={{ color: offer.status === 'COMPLETED' ? 'var(--success)' : 'var(--accent)' }}>
                      {offer.status === 'COMPLETED' ? 'Completed' : 'Approved'}
                    </span>
                    {offer.completedAt && (
                      <p className="text-[10px] flex items-center gap-1 justify-end mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        <Calendar size={10} /> {new Date(offer.completedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
