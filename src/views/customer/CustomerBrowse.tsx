import { useState } from 'react';
import { Search } from 'lucide-react';
import type { Listing } from '@/types';
import { useApp } from '@/context/AppContext';
import ListingCard from '@/components/ListingCard';
import ProvinceFilter from '@/components/ProvinceFilter';
import OfferModal from '@/components/OfferModal';
import DealerReviewsModal from '@/components/DealerReviewsModal';

export default function CustomerBrowse() {
  const { listings } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [reviewsDealer, setReviewsDealer] = useState<{ id: string; name: string; farmName: string; avatarUrl?: string | null } | null>(null);

  const filtered = listings.filter((l) => {
    const regionMatch = !selectedRegion || l.region === selectedRegion;
    const provinceMatch = !selectedProvince || l.province === selectedProvince;
    const searchMatch =
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.municipality.toLowerCase().includes(searchQuery.toLowerCase());
    return l.isActive && regionMatch && provinceMatch && searchMatch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: 'var(--text)' }}>
          Provincial Livestock Marketplace
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Browse live batches from verified dealers across all Philippine regions.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by title, category, batch, or municipality..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <ProvinceFilter
          region={selectedRegion}
          province={selectedProvince}
          onRegionChange={(r: string) => { setSelectedRegion(r); setSelectedProvince(''); }}
          onProvinceChange={setSelectedProvince}
        />
      </div>

      <div className="mb-4 text-sm" style={{ color: 'var(--text-muted)' }}>
        {filtered.length} {filtered.length === 1 ? 'listing' : 'listings'} available
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No listings match your filters. Try a different region, province, or search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onClick={() => setSelectedListing(listing)}
              onDealerClick={() => setReviewsDealer({ id: listing.dealerId, name: listing.dealerName, farmName: listing.farmName, avatarUrl: listing.dealerAvatarUrl })}
            />
          ))}
        </div>
      )}

      <OfferModal listing={selectedListing} onClose={() => setSelectedListing(null)} />

      <DealerReviewsModal
        dealerId={reviewsDealer?.id ?? null}
        dealerName={reviewsDealer?.name ?? ''}
        farmName={reviewsDealer?.farmName}
        avatarUrl={reviewsDealer?.avatarUrl}
        onClose={() => setReviewsDealer(null)}
      />
    </div>
  );
}
