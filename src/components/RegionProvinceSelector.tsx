import { REGIONS, REGION_KEYS } from '@/data/regions';

interface RegionProvinceSelectorProps {
  region: string;
  province: string;
  onRegionChange: (region: string) => void;
  onProvinceChange: (province: string) => void;
  regionLabel?: string;
  provinceLabel?: string;
}

export default function RegionProvinceSelector({
  region,
  province,
  onRegionChange,
  onProvinceChange,
  regionLabel = 'Region',
  provinceLabel = 'Province',
}: RegionProvinceSelectorProps) {
  const provinces = region ? REGIONS[region] ?? [] : [];

  const handleRegionChange = (newRegion: string) => {
    onRegionChange(newRegion);
    onProvinceChange('');
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>{regionLabel}</label>
        <select
          value={region}
          onChange={(e) => handleRegionChange(e.target.value)}
          className="input-field"
        >
          <option value="">Select region...</option>
          {REGION_KEYS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>{provinceLabel}</label>
        <select
          value={province}
          onChange={(e) => onProvinceChange(e.target.value)}
          className="input-field"
          disabled={!region}
        >
          <option value="">Select province...</option>
          {provinces.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
