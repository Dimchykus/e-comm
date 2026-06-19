import { PublicProductDto } from "../dto/public-product.dto";
import { IProduct } from "../interfaces/product.interface";

export const PUBLIC_PRODUCT_FIELDS = [
  "id",
  "name",
  "slug",
  "description",
  "shortDescription",
  "price",
  "compareAtPrice",
  "costPrice",
  "sku",
  "barcode",
  "stock",
  "lowStockThreshold",
  "status",
  "category",
  "brand",
  "weightGrams",
  "images",
  "tags",
  "metaTitle",
  "metaDescription",
  "isFeatured",
  "createdAt",
  "updatedAt",
] as const;

export function toPublicProduct(product: IProduct): PublicProductDto {
  const result = new PublicProductDto();

  for (const key of PUBLIC_PRODUCT_FIELDS) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- cast required for correlated index assignment
    (result[key] as PublicProductDto[typeof key]) = product[key];
  }

  return result;
}
