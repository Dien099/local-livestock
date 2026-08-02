import { useState, useEffect } from 'react';
import { X, Package, AlertCircle, Plus, Loader2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import RegionProvinceSelector from '@/components/RegionProvinceSelector';

interface AddListingModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AddListingModal({ open, onClose }: AddListingModalProps) {
  const { categories, createListing, addCustomCategory, currentUser } = useApp();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Poultry');
  const [isCustom, setIsCustom] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [quantity, setQuantity] = useState('100');
  const [pricePerHead, setPricePerHead] = useState('200');
  const [region, setRegion] = useState(currentUser?.region ?? '');
  const [province, setProvince] = useState(currentUser?.province ?? '');
  const [municipality, setMunicipality] = useState(currentUser?.municipality ?? '');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const allCategories = categories;

  useEffect(() => {
    if (open) {
      setTitle('');
      setCategory('Poultry');
      setIsCustom(false);
      setCustomCategory('');
      setQuantity('100');
      setPricePerHead('200');
      setRegion(currentUser?.region ?? '');
      setProvince(currentUser?.province ?? '');
      setMunicipality(currentUser?.municipality ?? '');
      setDescription('');
      setErrors({});
      setDone(false);
      setSubmitting(false);
    }
  }, [open, currentUser]);

  if (!open || !currentUser) return null;

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Title is required';
    if (isCustom && !customCategory.trim()) e.customCategory = 'Custom category name is required';
    const qtyNum = parseInt(quantity) || 0;
    const priceNum = parseInt(pricePerHead) || 0;
    if (qtyNum < 1) e.quantity = 'Quantity must be at least 1';
    if (priceNum < 1) e.pricePerHead = 'Price must be at least ₱1';
    if (!region) e.region = 'Region is required';
    if (!province) e.province = 'Province is required';
    if (!municipality.trim()) e.municipality = 'Municipality is required';
    if (!description.trim()) e.description = 'Description is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !currentUser) return;
    setSubmitting(true);
    const finalCategory = isCustom ? customCategory.trim() : category;
    const qtyNum = parseInt(quantity) || 0;
    const priceNum = parseInt(pricePerHead) || 0;
    if (isCustom) {
      await addCustomCategory(finalCategory);
    }
    const { error } = await createListing({
      title: title.trim(),
      category: finalCategory,
      pricePerHead: priceNum,
      availableStock: qtyNum,
      region,
      province,
      municipality: municipality.trim(),
      description: description.trim(),
    });
    setSubmitting(false);
    if (error) {
      setErrors({ submit: error });
      return;
    }
    setDone(true);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="p-8 text-center animate-fade-in">
            <div
              className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4"
              style={{ backgroundColor: 'color-mix(in srgb, var(--success) 15%, transparent)' }}
            >
              <Package size={32} style={{ color: 'var(--success)' }} />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>Batch Listed!</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              Your livestock batch is now live on the marketplace and visible to buyers.
            </p>
            <button onClick={onClose} className="btn-primary w-full">Done</button>
          </div>
        ) : (
          <>
            <div className="sticky top-0 flex items-center justify-between p-4 border-b" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Add New Livestock Batch</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Batch Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Healthy 35-day Broilers"
                  className="input-field"
                />
                {errors.title && <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--error)' }}><AlertCircle size={12} />{errors.title}</p>}
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Category</label>
                <div className="flex flex-wrap gap-2">
                  {allCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setCategory(cat); setIsCustom(false); }}
                      className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
                      style={
                        !isCustom && category === cat
                          ? { backgroundColor: 'var(--primary)', color: 'white' }
                          : { border: '1px solid var(--border)', color: 'var(--text)' }
                      }
                    >
                      {cat}
                    </button>
                  ))}
                  <button
                    onClick={() => setIsCustom(true)}
                    className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1"
                    style={
                      isCustom
                        ? { backgroundColor: 'var(--secondary)', color: 'white' }
                        : { border: '1px dashed var(--border)', color: 'var(--text-muted)' }
                    }
                  >
                    <Plus size={14} />
                    Add Custom
                  </button>
                </div>
                {isCustom && (
                  <div className="mt-2 animate-fade-in">
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="e.g. Turkey, Quail, Sheep, Rabbit..."
                      className="input-field"
                    />
                    {errors.customCategory && <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--error)' }}><AlertCircle size={12} />{errors.customCategory}</p>}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Quantity Available</label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    onBlur={() => { if (quantity === '' || (parseInt(quantity) || 0) < 1) setQuantity('1'); }}
                    className="input-field"
                    placeholder="100"
                  />
                  {errors.quantity && <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--error)' }}><AlertCircle size={12} />{errors.quantity}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Price per Head (₱)</label>
                  <input
                    type="number"
                    min={1}
                    value={pricePerHead}
                    onChange={(e) => setPricePerHead(e.target.value)}
                    onBlur={() => { if (pricePerHead === '' || (parseInt(pricePerHead) || 0) < 1) setPricePerHead('1'); }}
                    className="input-field"
                    placeholder="200"
                  />
                  {errors.pricePerHead && <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--error)' }}><AlertCircle size={12} />{errors.pricePerHead}</p>}
                </div>
              </div>

              <RegionProvinceSelector
                region={region}
                province={province}
                onRegionChange={setRegion}
                onProvinceChange={setProvince}
              />
              {(errors.region || errors.province) && (
                <p className="text-xs flex items-center gap-1" style={{ color: 'var(--error)' }}>
                  <AlertCircle size={12} />{errors.region || errors.province}
                </p>
              )}

              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Municipality / Barangay / Street</label>
                <input
                  type="text"
                  value={municipality}
                  onChange={(e) => setMunicipality(e.target.value)}
                  placeholder="e.g. Trece Martires, Brgy. San Agustin"
                  className="input-field"
                />
                {errors.municipality && <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--error)' }}><AlertCircle size={12} />{errors.municipality}</p>}
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the livestock batch — age, condition, feeding program, etc."
                  rows={3}
                  className="input-field resize-none"
                />
                {errors.description && <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--error)' }}><AlertCircle size={12} />{errors.description}</p>}
              </div>

              <button onClick={handleSubmit} disabled={submitting} className="btn-primary w-full py-3 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {submitting && <Loader2 size={18} className="animate-spin" />}
                Publish Listing
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
