export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  currency?: string;
  img?: string; // Main display image
  media: string[];
  vaultMedia?: { id: string; url: string; type: string; name: string }[];
  sizes?: string[];
  category: 'Heritage' | 'Streetwear' | 'Marketplace' | 'Accessories' | 'Materials';
  stock: number;
  tags: string[];
  vendorId: string;
  status: 'active' | 'archived' | 'drop';
  provenance?: string;
  createdAt?: any;
  updatedAt?: any;
  likes?: number;
  views?: number;
  ordersCount?: number;
  rating?: number;
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

export type UserTier = 'Explorer' | 'Insider' | 'Collector' | 'Elite' | 'Icon';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  username?: string;
  statusTier: 'Citizen' | 'Gold' | 'Platinum' | 'Diamond Elite';
  tier?: UserTier;
  role: 'citizen' | 'contributor' | 'admin';
  xp: number;
  leeBalance: number;
  reputationScore: number;
  stakedBalance?: number;
  lastYieldClaim?: any; // Firestore timestamp
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
  vaultMedia?: { id: string; name: string; type: string; url: string }[];
  createdAt?: any;
  updatedAt?: any;
}

export interface AuctionDrop {
  id: string;
  productId: string;
  sellerId?: string;
  title: string;
  description: string;
  img: string;
  type: 'timed' | 'flash' | 'live';
  startTime: any;
  endTime: any;
  startingBid: number;
  currentBid: number;
  bidCount: number;
  reservePrice?: number;
  buyNowPrice?: number;
  minIncrement?: number;
  winnerId?: string;
  status: 'upcoming' | 'active' | 'ended' | 'disputed';
  bids: Bid[];
  autoBids?: AutoBidConfig[];
  streamUrl?: string;
  escrowStatus?: 'none' | 'held' | 'released' | 'refunded';
}

export interface AutoBidConfig {
  userId: string;
  maxBid: number;
  increment: number;
}

export interface Bid {
  id: string;
  userId: string;
  userPhoto?: string;
  username: string;
  amount: number;
  timestamp: any;
  isAutoBid?: boolean;
}

export interface Wallet {
  userId: string;
  balance: number;
  leeBalance: number;
  escrowBalance: number;
  currency: string;
  updatedAt: any;
  tier: UserTier;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  amount: number;
  leeAmount?: number;
  type: 'deposit' | 'withdrawal' | 'payment' | 'escrow_hold' | 'escrow_release' | 'refund' | 'lee_reward' | 'lee_burn' | 'delivery_subsidy' | 'creator_tip' | 'social_gift' | 'attendance_reward' | 'engagement_reward';
  status: 'pending' | 'completed' | 'failed';
  referenceId?: string; // e.g. auctionId or Paystack reference
  metadata?: Record<string, any>;
  timestamp: any;
}

export interface RewardCampaign {
  id: string;
  title: string;
  description: string;
  type: 'auction_participation' | 'livestream_attendance' | 'purchase_streak' | 'referral' | 'content_creation';
  leeReward: number;
  xpReward: number;
  multiplier: number;
  isActive: boolean;
  endsAt: any;
}

export interface DeliverySubsidy {
  id: string;
  orderId: string;
  userId: string;
  leeBurned: number;
  fiatSaved: number;
  type: 'standard' | 'priority' | 'same_day_boost';
  aiRecommended: boolean;
  timestamp: any;
}

export interface SocialGift {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  leeAmount: number;
  message?: string;
  type: 'tip' | 'gift' | 'subsidy_share';
  timestamp: any;
}

export interface AuctionComment {
  id: string;
  auctionId: string;
  userId: string;
  username: string;
  userPhoto: string;
  message: string;
  reactions: Record<string, number>;
  timestamp: any;
}
