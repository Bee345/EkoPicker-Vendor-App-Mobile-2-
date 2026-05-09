// ─── Shared ────────────────────────────────────────────────────────────────
export type BusinessType = 'restaurant' | 'retail' | 'pharmacy' | 'orders' | 'others';

// ─── Vendor / Auth ─────────────────────────────────────────────────────────
export interface Vendor {
  _id: string;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  businessType: BusinessType;
  businessSubCategory?: string;
  avatar?: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterStep1Dto {
  businessType: BusinessType;
  businessSubCategory?: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  phone: string;
  password: string;
  businessName: string;
  businessType: BusinessType;
  businessSubCategory?: string;
  address: VendorAddress;
}

export interface VendorAddress {
  country: string;
  state: string;
  city: string;
  streetAddress: string;
  landmark?: string;
  gpsCoordinates?: string;
  marketId?: string;
  locationType: 'market' | 'independent';
}

export interface AuthResponse {
  vendor: Vendor;
  tokens: AuthTokens;
}
