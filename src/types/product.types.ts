import { BusinessType } from './auth.types';

export type ProductStatus = 'active' | 'inactive' | 'out_of_stock';

export interface Product {
  _id: string;
  vendorId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  businessType: BusinessType;
  status: ProductStatus;
  images: string[];
  // Restaurant specific
  spiceLevel?: 'Mild' | 'Medium' | 'Hot' | 'Extra Hot';
  variants?: ProductVariant[];
  preparationTime?: number; // minutes
  // Retail / Pharmacy specific
  brand?: string;
  sku?: string;
  quantityInStock?: number;
  discount?: number;
  // Pharmacy specific
  genericName?: string;
  dosage?: string;
  manufacturer?: string;
  expiryDate?: string;
  batchNumber?: string;
  prescriptionRequired?: boolean;
  // Supply / Orders specific
  unit?: string;
  minimumOrderQuantity?: number;
  bulkPricing?: BulkPricingTier[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  name: string;
  options: string[];
}

export interface BulkPricingTier {
  minQuantity: number;
  pricePerUnit: number;
}

export interface CreateProductDto {
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  status?: ProductStatus;
  spiceLevel?: string;
  brand?: string;
  sku?: string;
  quantityInStock?: number;
  discount?: number;
  genericName?: string;
  dosage?: string;
  manufacturer?: string;
  expiryDate?: string;
  batchNumber?: string;
  prescriptionRequired?: boolean;
  unit?: string;
  minimumOrderQuantity?: number;
}

export type UpdateProductDto = Partial<CreateProductDto>;
