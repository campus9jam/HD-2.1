export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  currency?: string;
  img?: string; // Main display image
  media: string[];
  driveMedia?: { url: string; type: string; name: string }[];
  sizes?: string[];
  category: 'Heritage' | 'Streetwear' | 'Marketplace' | 'Accessories';
  stock: number;
  tags: string[];
  vendorId: string;
  status: 'active' | 'archived' | 'drop';
  provenance?: string;
  translations?: Record<string, {
    title: string;
    description: string;
    confidence: number;
  }>;
}

export interface Vendor {
  id: string;
  name: string;
  description: string;
  location: string;
  rating: number;
  specialty: string;
  accreditationLevel: 'Gold' | 'Platinum' | 'Master';
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  username?: string;
  statusTier: 'Citizen' | 'Gold' | 'Platinum' | 'Diamond Elite';
  role: 'citizen' | 'contributor' | 'admin';
  xp: number;
  identities: string[]; // RSA_4096 IDs
  communicationChannels?: ('Email' | 'WhatsApp' | 'Discord' | 'Neural_Native')[];
  savedAddresses?: { label: string; address: string }[];
  identityMarkers?: {
    title: string;
    tribe: string;
    lineage: string;
  };
  achievements?: {
    id: string;
    title: string;
    icon: string;
    unlockedAt: any;
  }[];
  createdAt?: any;
  updatedAt?: any;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface AtelierClient {
  id?: string;
  clientName: string;
  phone: string;
  email: string;
  address: string;
  clientType: 'Regular' | 'VIP' | 'New';
  username: string; // Alphanumeric primary identifier
  notes: string;
  createdAt?: any;
}

export interface AtelierMeasurements {
  bustChest: string;
  waist: string;
  hips: string;
  length: string;
  shoulder: string;
  sleeve: string;
  armhole: string;
  neck: string;
  thigh: string;
  knee: string;
  cuff: string;
  additional: string;
}

export interface AtelierOrder {
  id: string;
  clientId?: string;
  clientUsername: string;
  outfitName: string;
  outfitType: string;
  styleNotes: string;
  fabric: string;
  serialNumber: string;
  deadline: string;
  price: number;
  measurements: AtelierMeasurements;
  orderNotes: string;
  status: 'Pending' | 'Cutting' | 'Sewing' | 'Fitting' | 'Ready' | 'Delivered' | 'Cancelled';
  priority: 'Normal' | 'High' | 'Urgent';
  depositPaid: boolean;
  balancePaid: boolean;
  imageDataUrls: string[];
  driveFiles?: { id: string; name: string; type: string; url: string }[];
  createdAt?: any;
  updatedAt?: any;
}
