export interface MarketItem {
  id: string;
  title: string;
  price: number;
  img: string;
  category: 'Heritage' | 'Textiles' | 'Bags' | 'Accessories' | 'Other';
  artisan: string;
  description?: string;
  isNegotiable?: boolean;
}

export const MARKET_ITEMS: MarketItem[] = [
  { 
    id: 'p1', 
    title: 'Ekene Dashiki', 
    price: 50000, 
    img: 'https://picsum.photos/seed/dashiki/800/1000', 
    category: 'Heritage',
    artisan: 'Kano Guild',
    description: 'A traditional dashiki refined with modern cotton blends and hand-stitched embroidery.',
    isNegotiable: true
  },
  { 
    id: 'p2', 
    title: 'Libas Bag', 
    price: 35000, 
    img: 'https://picsum.photos/seed/bag/800/1000', 
    category: 'Accessories',
    artisan: 'Zaria Tannery',
    description: 'Leather-bound messenger bag inspired by Saharan nomadic saddlecraft.'
  },
  { 
    id: 'p3', 
    title: 'Kano Kaftan', 
    price: 85000, 
    img: 'https://picsum.photos/seed/kaftan/800/1000', 
    category: 'Heritage',
    artisan: 'Kano Guild',
    description: 'Royal court Kaftan with signature royal blue threads and high-status collar.',
    isNegotiable: true
  },
  { 
    id: 'p4', 
    title: 'Desert Scarf', 
    price: 12000, 
    img: 'https://picsum.photos/seed/scarf/800/1000', 
    category: 'Accessories',
    artisan: 'Sahara Loom',
    description: 'Lightweight linen scarf for protection against the heat and dust of the open plains.'
  }
];
