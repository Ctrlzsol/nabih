
export type Language = 'en' | 'ar';
export type Platform = 'consumer' | 'merchant' | 'admin';
export type UserRole = 'consumer' | 'merchant' | 'admin' | 'individual';
export type AccountStatus = 'active' | 'pending' | 'suspended' | 'deleted' | 'rejected' | 'approved';
export type AdStatus = 'draft' | 'pending_review' | 'active' | 'paused' | 'rejected' | 'deleted';

export interface SearchPreferences {
  priority: 'balanced' | 'price' | 'quality' | 'excellent_condition';
  condition: 'new' | 'used' | 'all';
  minPrice?: number;
  maxPrice?: number;
  limit: number;
  isGlobal?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  role: UserRole;
  roles?: UserRole[];
  status: AccountStatus;
  storeName?: string;
  crNumber?: string;
  taxNumber?: string;
  storeCategory?: string;
  storeAddress?: string;
  createdAt: string;
  isDeleted?: boolean;
}

export interface HistoryItem {
  id: string;
  query: string;
  country: string;
  timestamp: string;
}

export interface MerchantAd {
  id: string;
  merchantId: string;
  merchantName: string;
  title: string;
  description: string;
  imageUrl: string;
  targetUrl: string;
  targetCountries: string[];
  category: string;
  tags: string[];
  status: AdStatus;
  rejectionReason?: string;
  impressions: number;
  clicks: number;
  ctr: number;
  createdAt: string;
  expiryDate?: string;
  isDeleted?: boolean;
}

export interface ProductOption {
  name: string;
  store: string;
  price: string;
  currency: string;
  unitPrice?: string;
  rating: number;
  reviewsCount?: string;
  customerSentiment?: string;
  pros: string[];
  cons: string[];
  features: string[];
  link: string;
  imageUrl: string;
  isBestValue: boolean;
  isLowestPrice: boolean;
  explanation: string;
  score: number;
  storeDomain?: string;
  recommendationBadge?: string;
  shippingInfo?: string;
  shippingCost?: string;
  deliveryTime?: string;
  warrantyInfo?: string;
  returnPolicy?: string;
  stockStatus?: string;
  nabihVerdict?: string;
  adNumber?: string;
}

export interface ComparisonResult {
  query: string;
  summary: string;
  options: ProductOption[];
  sources: { title: string; uri: string }[];
  disambiguationOptions?: string[];
  smartFilterSuggestions?: string[];
  sortingOptions?: string[];
}

export interface UIStrings {
  title: string;
  slogan: string;
  subtitle: string;
  placeholder: string;
  compareBtn: string;
  bestValue: string;
  lowestPrice: string;
  unitPrice: string;
  reviews: string;
  rating: string;
  features: string;
  pros: string;
  cons: string;
  loading: string;
  loadingSub: string;
  matchScoreHelp: string;
  visitStore: string;
  loadMore: string;
  startSearch: string;
  startFreeTrial: string;
  compareHeader: { main: string; phrases: string[] };
  historyTitle: string;
  historySubtitle: string;
  auth: {
    signIn: string;
    signUp: string;
    welcome: string;
    welcomeSubLogin: string;
    welcomeSubSignup: string;
    name: string;
    storeName: string;
    selectCountryPlaceholder: string;
    phone: string;
    email: string;
    password: string;
    switchSignup: string;
    switchLogin: string;
    pendingApproval: string;
    pendingDesc: string;
  };
  smartCriteria: { balanced: string; cheapest: string; topQuality: string; excellentCondition: string };
  shipping: string;
  shippingCost: string;
  deliveryTime: string;
  warranty: string;
  returnPolicy: string;
  availability: string;
  inStock: string;
  outStock: string;
  nabihVerdict: string;
  footerDesc: string;
  madeBy: string;
  nextGenBadge: string;
  noHistory: string;
  history: string;
  clearHistory: string;
  globalSearch: string;
  localSearchOnly: string;
  compareProducts: string;
  selectToCompare: string;
  comparing: string;
  clearSelection: string;
  redirectingMsg: string;
  platforms: {
    consumer: string;
    merchant: string;
    switch: string;
  }
}
