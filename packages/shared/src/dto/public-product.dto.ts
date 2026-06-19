import { ApiProperty } from "@nestjs/swagger";
import { ProductStatus } from "../interfaces/product.interface";

export class PublicProductDto {
  @ApiProperty({ example: "uuid-v4" })
  id: string;

  @ApiProperty({ example: "Wireless Headphones" })
  name: string;

  @ApiProperty({ example: "wireless-headphones" })
  slug: string;

  @ApiProperty({
    example: "High-quality wireless headphones with noise cancellation.",
  })
  description: string;

  @ApiProperty({ example: "Great sound, great price.", nullable: true })
  shortDescription: string | null;

  @ApiProperty({ example: 99.99 })
  price: number;

  @ApiProperty({ example: 129.99, nullable: true })
  compareAtPrice: number | null;

  @ApiProperty({ example: 45.0, nullable: true })
  costPrice: number | null;

  @ApiProperty({ example: "SKU-001", nullable: true })
  sku: string | null;

  @ApiProperty({ example: "1234567890123", nullable: true })
  barcode: string | null;

  @ApiProperty({ example: 50 })
  stock: number;

  @ApiProperty({ example: 5 })
  lowStockThreshold: number;

  @ApiProperty({ enum: ProductStatus, example: ProductStatus.ACTIVE })
  status: ProductStatus;

  @ApiProperty({ example: "Electronics", nullable: true })
  category: string | null;

  @ApiProperty({ example: "Sony", nullable: true })
  brand: string | null;

  @ApiProperty({ example: 250, nullable: true })
  weightGrams: number | null;

  @ApiProperty({
    example: ["https://cdn.example.com/img1.jpg"],
    type: [String],
  })
  images: string[];

  @ApiProperty({
    example: ["sale", "new-arrival"],
    type: [String],
    nullable: true,
  })
  tags: string[] | null;

  @ApiProperty({ example: "Buy Wireless Headphones Online", nullable: true })
  metaTitle: string | null;

  @ApiProperty({
    example: "Shop the best wireless headphones.",
    nullable: true,
  })
  metaDescription: string | null;

  @ApiProperty({ example: false })
  isFeatured: boolean;

  @ApiProperty({ example: "2024-01-01T00:00:00.000Z" })
  createdAt: Date;

  @ApiProperty({ example: "2024-06-01T00:00:00.000Z" })
  updatedAt: Date;

  @ApiProperty({ example: null, nullable: true })
  deletedAt: Date | null;
}
