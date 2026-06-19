export enum ProductStatus {
  ACTIVE = "active",
  DRAFT = "draft",
  ARCHIVED = "archived",
}

export interface IProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  price: number;
  compareAtPrice: number | null;
  costPrice: number | null;
  sku: string | null;
  barcode: string | null;
  stock: number;
  lowStockThreshold: number;
  status: ProductStatus;
  category: string | null;
  brand: string | null;
  weightGrams: number | null;
  images: string[];
  tags: string[] | null;
  metaTitle: string | null;
  metaDescription: string | null;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
