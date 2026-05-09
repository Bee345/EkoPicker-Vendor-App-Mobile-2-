// ─── App Colors ─────────────────────────────────────────────────────────────
export const COLORS = {
  primary: '#0F172A',    // indigo-950 equivalent
  accent: '#FACC15',     // yellow-400
  accentDark: '#CA8A04', // yellow-600
  white: '#FFFFFF',
  background: '#F8FAFC', // slate-50
  backgroundDark: '#0F172A',
  card: '#FFFFFF',
  cardDark: '#1E293B',   // slate-800
  muted: '#64748B',      // slate-500
  mutedLight: '#CBD5E1', // slate-300
  success: '#10B981',    // emerald-500
  danger: '#F43F5E',     // rose-500
  warning: '#F59E0B',    // amber-500
  info: '#3B82F6',       // blue-500
  border: '#F1F5F9',     // slate-100
  borderDark: '#334155', // slate-700
};

// ─── Tab Names ───────────────────────────────────────────────────────────────
export const TABS = {
  DASHBOARD: 'Dashboard',
  PRODUCTS: 'Products',
  ORDERS: 'Orders',
  CHAT: 'Chat',
  MORE: 'More',
} as const;

// ─── Screen Names (for navigation) ──────────────────────────────────────────
export const SCREENS = {
  // Auth Stack
  SPLASH: 'Splash',
  ONBOARDING: 'Onboarding',
  AUTH_CHOICE: 'AuthChoice',
  LOGIN: 'Login',
  REGISTER_STEP1: 'RegisterStep1',
  REGISTER_STEP2: 'RegisterStep2',
  PENDING_APPROVAL: 'PendingApproval',

  // Dashboard Stack
  DASHBOARD: 'DashboardHome',
  NOTIFICATIONS: 'Notifications',

  // Products Stack
  PRODUCT_LIST: 'ProductList',
  PRODUCT_DETAILS: 'ProductDetails',
  ADD_PRODUCT: 'AddProduct',
  EDIT_PRODUCT: 'EditProduct',

  // Orders Stack
  ORDER_LIST: 'OrderList',
  ORDER_DETAILS: 'OrderDetails',

  // Chat Stack
  CHAT_LIST: 'ChatList',
  CHAT_CONVERSATION: 'ChatConversation',

  // More Stack
  MORE: 'MoreHome',
  EARNINGS: 'Earnings',
  PROFILE: 'Profile',
  EDIT_PROFILE: 'EditProfile',
  CHANGE_PASSWORD: 'ChangePassword',
  STORE_SETTINGS: 'StoreSettings',
  SETTINGS: 'Settings',
} as const;

// ─── Business Type Labels ─────────────────────────────────────────────────────
export const BUSINESS_TYPE_LABELS: Record<string, string> = {
  restaurant: 'Restaurant',
  retail: 'Retail Store',
  pharmacy: 'Pharmacy',
  orders: 'Wholesale / Supply',
  others: 'Other Business',
};

export const BUSINESS_TYPE_GREETINGS: Record<string, string> = {
  restaurant: 'Chef,',
  retail: 'Manager,',
  pharmacy: 'Pharmacist,',
  orders: 'Supplier,',
  others: 'Partner,',
};

// ─── Pagination ───────────────────────────────────────────────────────────────
export const PAGE_SIZE = 20;
