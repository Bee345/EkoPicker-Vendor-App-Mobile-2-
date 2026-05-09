import apiClient from './api';
import { Order, OrderStatus } from '../types/order.types';

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

// ─── Mock data ──────────────────────────────────────────────────────────────
const MOCK_ORDERS: Order[] = [
  {
    _id: 'ord_001', orderNumber: '#212323', vendorId: 'vendor_001',
    user: { _id: 'u1', name: 'Raiden Lord', phone: '+2348011111111', avatar: 'https://i.pravatar.cc/100?u=u1' },
    items: [
      { productId: 'p1', productName: 'Premium Wireless Headphones', productImage: 'https://picsum.photos/seed/headphones/200/200', quantity: 1, price: 45000 },
      { productId: 'p2', productName: 'Organic Green Tea Bags', productImage: 'https://picsum.photos/seed/tea/200/200', quantity: 2, price: 2500 },
    ],
    subtotal: 50000, deliveryFee: 1500, total: 51500,
    status: 'pending',
    deliveryAddress: { fullAddress: '23 Adeola Odeku St, Victoria Island', city: 'Lagos', state: 'Lagos', landmark: 'Near GTBank' },
    paymentMethod: 'card', paymentStatus: 'paid',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    _id: 'ord_002', orderNumber: '#212322', vendorId: 'vendor_001',
    user: { _id: 'u2', name: 'Yae Miko', phone: '+2348022222222', avatar: 'https://i.pravatar.cc/100?u=u2' },
    items: [
      { productId: 'p4', productName: 'Assorted Biscuits Pack', productImage: 'https://picsum.photos/seed/biscuits/200/200', quantity: 3, price: 3500 },
    ],
    subtotal: 10500, deliveryFee: 1000, total: 11500,
    status: 'confirmed',
    deliveryAddress: { fullAddress: '7 Allen Avenue, Ikeja', city: 'Lagos', state: 'Lagos' },
    paymentMethod: 'transfer', paymentStatus: 'paid',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    _id: 'ord_003', orderNumber: '#212321', vendorId: 'vendor_001',
    user: { _id: 'u3', name: 'Zhongli Li', phone: '+2348033333333', avatar: 'https://i.pravatar.cc/100?u=u3' },
    items: [
      { productId: 'p5', productName: 'Bluetooth Smart Watch', productImage: 'https://picsum.photos/seed/watch/200/200', quantity: 1, price: 25000 },
      { productId: 'p6', productName: 'Mineral Water (12 pack)', productImage: 'https://picsum.photos/seed/water/200/200', quantity: 2, price: 1800 },
    ],
    subtotal: 28600, deliveryFee: 1000, total: 29600,
    status: 'delivered',
    deliveryAddress: { fullAddress: '15 Broad St, Lagos Island', city: 'Lagos', state: 'Lagos' },
    paymentMethod: 'cash', paymentStatus: 'paid',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
  },
  {
    _id: 'ord_004', orderNumber: '#212320', vendorId: 'vendor_001',
    user: { _id: 'u4', name: 'Venti Bard', phone: '+2348044444444', avatar: 'https://i.pravatar.cc/100?u=u4' },
    items: [
      { productId: 'p3', productName: 'Liquid Laundry Detergent', productImage: 'https://picsum.photos/seed/detergent/200/200', quantity: 4, price: 5500 },
    ],
    subtotal: 22000, deliveryFee: 1500, total: 23500,
    status: 'cancelled',
    deliveryAddress: { fullAddress: '5 Opebi Road, Ikeja', city: 'Lagos', state: 'Lagos' },
    paymentMethod: 'card', paymentStatus: 'failed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 47).toISOString(),
  },
];

// ─── Orders Service ──────────────────────────────────────────────────────────
export const ordersService = {
  async getAll(status?: OrderStatus): Promise<Order[]> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 600));
      if (status) return MOCK_ORDERS.filter((o) => o.status === status);
      return [...MOCK_ORDERS];
    }
    const params = status ? { status } : {};
    const { data } = await apiClient.get<Order[]>('/vendor/orders', { params });
    return data;
  },

  async getById(id: string): Promise<Order> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 300));
      const order = MOCK_ORDERS.find((o) => o._id === id);
      if (!order) throw new Error('Order not found');
      return order;
    }
    const { data } = await apiClient.get<Order>(`/vendor/orders/${id}`);
    return data;
  },

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 400));
      const idx = MOCK_ORDERS.findIndex((o) => o._id === id);
      if (idx === -1) throw new Error('Order not found');
      MOCK_ORDERS[idx] = { ...MOCK_ORDERS[idx], status, updatedAt: new Date().toISOString() };
      return MOCK_ORDERS[idx];
    }
    const { data } = await apiClient.patch<Order>(`/vendor/orders/${id}/status`, { status });
    return data;
  },

  async getDashboardStats() {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 400));
      const today = MOCK_ORDERS.filter((o) => {
        const d = new Date(o.createdAt);
        const now = new Date();
        return d.toDateString() === now.toDateString();
      });
      return {
        todayOrders: today.length,
        pendingOrders: MOCK_ORDERS.filter((o) => o.status === 'pending').length,
        completedOrders: MOCK_ORDERS.filter((o) => o.status === 'delivered').length,
        todayRevenue: today.reduce((sum, o) => sum + o.total, 0),
        totalRevenue: MOCK_ORDERS.filter((o) => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.total, 0),
      };
    }
    const { data } = await apiClient.get('/vendor/orders/dashboard-stats');
    return data;
  },
};
