import { useState } from 'react';
import { Store, Package, TrendingDown, MapPin, Plus } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import AddListingModal from '@/components/AddListingModal';
import BackButton from '@/components/BackButton';

interface DealerInventoryProps {
  onIncoming: () => void;
}

export default function DealerInventory({ onIncoming }: DealerInventoryProps) {
  const { listings, currentUser } = useApp();
  const [showAdd, setShowAdd] = useState(false);

  const myListings = listings.filter((l) => l.dealerId === currentUser?.id);

  const totalStock = myListings.reduce((sum, l) => sum + l.availableStock, 0);
  const totalSold = myListings.reduce((sum, l) => sum + (l.originalStock - l.availableStock), 0);
  const activeBatches = myListings.filter((l) => l.isActive && l.availableStock > 0).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <BackButton label="Incoming Offers" onClick={onIncoming} />
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: 'var(--text)' }}>Active Inventory</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Real-time stock counters for your listed batches.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 self-start sm:self-auto min-h-[44px]">
          <Plus size={18} />
          Add New Batch
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
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
            <Store size={16} style={{ color: 'var(--secondary)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Active Batches</span>
          </div>
          <span className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{activeBatches}</span>
        </div>
      </div>

      {myListings.length === 0 ? (
        <div className="card p-12 text-center">
          <Store size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>No inventory listings yet. Create your first batch to start selling.</p>
          <button onClick={() => setShowAdd(true)} className="btn-primary inline-flex items-center gap-2 min-h-[44px]">
            <Plus size={18} /> Add New Batch
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {myListings.map((listing) => {
            const stockPercent = listing.originalStock > 0 ? (listing.availableStock / listing.originalStock) * 100 : 0;
            const sold = listing.originalStock - listing.availableStock;
            return (
              <div key={listing.id} className="card overflow-hidden animate-slide-up">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold text-white shadow-sm" style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 90%, transparent)' }}>
                      {listing.category}
                    </span>
                  </div>
                  {listing.availableStock === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                      <span className="text-white font-bold text-sm uppercase tracking-wide">Sold Out</span>
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>{listing.title}</h3>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Batch {listing.batchNumber}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin size={12} style={{ color: 'var(--text-muted)' }} />
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{listing.municipality}, {listing.province}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Live Stock Counter</span>
                      <span className="text-xs font-bold" style={{ color: stockPercent < 20 ? 'var(--error)' : 'var(--success)' }}>
                        {Math.round(stockPercent)}%
                      </span>
                    </div>
                    <div className="flex items-end justify-between mb-2">
                      <div>
                        <span className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{listing.availableStock.toLocaleString()}</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}> / {listing.originalStock.toLocaleString()}</span>
                      </div>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{sold} sold</span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${stockPercent}%`,
                          backgroundColor: stockPercent < 20 ? 'var(--error)' : 'var(--success)',
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>Price/head</span>
                    <span className="font-bold" style={{ color: 'var(--primary)' }}>₱{listing.pricePerHead.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddListingModal open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}
