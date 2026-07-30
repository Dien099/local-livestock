export const REGIONS: Record<string, string[]> = {
  'NCR': ['Metro Manila'],
  'CAR': ['Abra', 'Apayao', 'Benguet', 'Ifugao', 'Kalinga', 'Mountain Province'],
  'Region I': ['Ilocos Norte', 'Ilocos Sur', 'La Union', 'Pangasinan'],
  'Region II': ['Batanes', 'Cagayan', 'Isabela', 'Nueva Vizcaya', 'Quirino'],
  'Region III': ['Aurora', 'Bataan', 'Bulacan', 'Nueva Ecija', 'Pampanga', 'Tarlac', 'Zambales'],
  'Region IV-A': ['Batangas', 'Cavite', 'Laguna', 'Quezon', 'Rizal'],
  'Region IV-B': ['Marinduque', 'Occidental Mindoro', 'Oriental Mindoro', 'Palawan', 'Romblon'],
  'Region V': ['Albay', 'Camarines Norte', 'Camarines Sur', 'Catanduanes', 'Masbate', 'Sorsogon'],
  'Region VI': ['Aklan', 'Antique', 'Capiz', 'Guimaras', 'Iloilo', 'Negros Occidental'],
  'Region VII': ['Bohol', 'Cebu', 'Negros Oriental', 'Siquijor'],
  'Region VIII': ['Biliran', 'Eastern Samar', 'Leyte', 'Northern Samar', 'Samar', 'Southern Leyte'],
  'Region IX': ['Zamboanga del Norte', 'Zamboanga del Sur', 'Zamboanga Sibugay'],
  'Region X': ['Bukidnon', 'Camiguin', 'Lanao del Norte', 'Misamis Occidental', 'Misamis Oriental'],
  'Region XI': ['Compostela Valley', 'Davao de Oro', 'Davao del Norte', 'Davao del Sur', 'Davao Occidental', 'Davao Oriental'],
  'Region XII': ['Cotabato', 'Sarangani', 'South Cotabato', 'Sultan Kudarat'],
  'Region XIII': ['Agusan del Norte', 'Agusan del Sur', 'Dinagat Islands', 'Surigao del Norte', 'Surigao del Sur'],
  'BARMM': ['Basilan', 'Lanao del Sur', 'Maguindanao', 'Sulu', 'Tawi-Tawi'],
};

export const REGION_KEYS = Object.keys(REGIONS);

export const ALL_PROVINCES: string[] = Object.values(REGIONS).flat();

export const DEFAULT_CATEGORIES: string[] = ['Poultry', 'Swine', 'Cattle', 'Goat', 'Duck'];

export const CATEGORY_IMAGES: Record<string, string> = {
  Poultry: 'https://images.pexels.com/photos/17064389/pexels-photo-17064389.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  Swine: 'https://images.pexels.com/photos/20729021/pexels-photo-20729021.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  Cattle: 'https://images.pexels.com/photos/7164014/pexels-photo-7164014.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  Goat: 'https://images.pexels.com/photos/7568157/pexels-photo-7568157.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  Duck: 'https://images.pexels.com/photos/29606569/pexels-photo-29606569.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  Turkey: 'https://images.pexels.com/photos/34623942/pexels-photo-34623942.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  Quail: 'https://images.pexels.com/photos/4530404/pexels-photo-4530404.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
};

export const FALLBACK_IMAGE = 'https://images.pexels.com/photos/6339152/pexels-photo-6339152.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';
