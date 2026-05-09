import apiClient from './api';
import { Product, CreateProductDto, UpdateProductDto } from '../types/product.types';

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

// ─── Mock data ──────────────────────────────────────────────────────────────
let MOCK_PRODUCTS: Product[] = [
  {
    _id: 'p1',
    vendorId: 'vendor_001',
    name: 'Premium Wireless Headphones',
    description: 'High-quality noise-cancelling wireless headphones with 30-hour battery life.',
    price: 45000,
    category: 'Electronics',
    businessType: 'retail',
    status: 'active',
    images: ['https://picsum.photos/seed/headphones/400/400'],
    brand: 'Sony',
    sku: 'SNY-WH-1000XM4',
    quantityInStock: 24,
    discount: 15,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'p2',
    vendorId: 'vendor_001',
    name: 'Organic Green Tea Bags (25 pcs)',
    description: 'Premium organic green tea bags sourced from the finest tea gardens.',
    price: 2500,
    category: 'Groceries',
    businessType: 'retail',
    status: 'active',
    images: ['https://picsum.photos/seed/tea/400/400'],
    brand: 'Lipton',
    sku: 'LPT-GRN-TEA',
    quantityInStock: 150,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'p3',
    vendorId: 'vendor_001',
    name: 'Liquid Laundry Detergent',
    description: 'Powerful liquid detergent for all fabric types.',
    price: 5500,
    category: 'Household',
    businessType: 'retail',
    status: 'out_of_stock',
    images: ['https://picsum.photos/seed/detergent/400/400'],
    brand: 'Ariel',
    sku: 'ARL-LQD-DET',
    quantityInStock: 0,
    discount: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'p4',
    vendorId: 'vendor_001',
    name: 'Assorted Biscuits Pack',
    description: 'Delightful assortment of classic biscuits in a gift-ready pack.',
    price: 3500,
    category: 'Packaged Goods',
    businessType: 'retail',
    status: 'active',
    images: ['https://picsum.photos/seed/biscuits/400/400'],
    brand: "McVitie's",
    sku: 'MCV-BSC-001',
    quantityInStock: 45,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'p5',
    vendorId: 'vendor_001',
    name: 'Bluetooth Smart Watch',
    description: 'Fitness tracking smartwatch with heart rate monitor and GPS.',
    price: 25000,
    category: 'Electronics',
    businessType: 'retail',
    status: 'active',
    images: ['https://picsum.photos/seed/watch/400/400'],
    brand: 'Samsung',
    sku: 'SAM-GT-01',
    quantityInStock: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'p6',
    vendorId: 'vendor_001',
    name: 'Mineral Water (12 pack)',
    description: 'Pure natural spring water, 500ml bottles, pack of 12.',
    price: 1800,
    category: 'Groceries',
    businessType: 'retail',
    status: 'active',
    images: ['https://picsum.photos/seed/water/400/400'],
    brand: 'Eva',
    sku: 'EVA-H2O-12',
    quantityInStock: 300,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let nextId = 100;

// ─── Products Service ────────────────────────────────────────────────────────
export const productsService = {
  async getAll(): Promise<Product[]> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 600));
      return [...MOCK_PRODUCTS];
    }
    const { data } = await apiClient.get<Product[]>('/vendor/products');
    return data;
  },

  async getById(id: string): Promise<Product> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 300));
      const product = MOCK_PRODUCTS.find((p) => p._id === id);
      if (!product) throw new Error('Product not found');
      return product;
    }
    const { data } = await apiClient.get<Product>(`/vendor/products/${id}`);
    return data;
  },

  async create(dto: CreateProductDto): Promise<Product> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 800));
      // Mock-only widening: CreateProductDto.spiceLevel is `string` for form
      // input flexibility; Product narrows it. Real backend should validate.
      const newProduct = {
        _id: `p${++nextId}`,
        vendorId: 'vendor_001',
        businessType: 'retail' as const,
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...dto,
      } as Product;
      MOCK_PRODUCTS.unshift(newProduct);
      return newProduct;
    }
    const { data } = await apiClient.post<Product>('/vendor/products', dto);
    return data;
  },

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 500));
      const idx = MOCK_PRODUCTS.findIndex((p) => p._id === id);
      if (idx === -1) throw new Error('Product not found');
      MOCK_PRODUCTS[idx] = {
        ...MOCK_PRODUCTS[idx],
        ...dto,
        updatedAt: new Date().toISOString(),
      } as Product;
      return MOCK_PRODUCTS[idx];
    }
    const { data } = await apiClient.patch<Product>(`/vendor/products/${id}`, dto);
    return data;
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 400));
      MOCK_PRODUCTS = MOCK_PRODUCTS.filter((p) => p._id !== id);
      return;
    }
    await apiClient.delete(`/vendor/products/${id}`);
  },

  async toggleStatus(id: string): Promise<Product> {
    if (USE_MOCK) {
      const product = MOCK_PRODUCTS.find((p) => p._id === id);
      if (!product) throw new Error('Product not found');
      const newStatus = product.status === 'active' ? 'out_of_stock' : 'active';
      return this.update(id, { status: newStatus });
    }
    const { data } = await apiClient.patch<Product>(`/vendor/products/${id}/toggle-status`);
    return data;
  },
};
