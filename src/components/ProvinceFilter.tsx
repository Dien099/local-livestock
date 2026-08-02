import { REGIONS, REGION_KEYS, ALL_PROVINCES } from '@/data/regions';

interface ProvinceFilterProps {
  region: string;
  province: string;
  onRegionChange: (region: string) => void;
  onProvinceChange: (province: string) => void;
}

export default function ProvinceFilter({ region, province, onRegionChange, onProvinceChange }: ProvinceFilterProps) {
  const provinces = region ? REGIONS[region] ?? [] : ALL_PROVINCES;

  const handleRegionChange = (newRegion: string) => {
    onRegionChange(newRegion);
    onProvinceChange('');
  };

  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-stretch sm:items-center">
      <select
        value={region}
        onChange={(e) => handleRegionChange(e.target.value)}
        className="input-field-auto min-h-[44px] flex-1 sm:flex-initial"
      >
        <option value="">All Regions</option>
        {REGION_KEYS.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
      <select
        value={province}
        onChange={(e) => onProvinceChange(e.target.value)}
        className="input-field-auto min-h-[44px] flex-1 sm:flex-initial"
        disabled={!region && false}
      >
        <option value="">All Provinces</option>
        {provinces.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
    </div>
  );
}
