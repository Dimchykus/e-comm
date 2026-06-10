import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { ProductStatus } from '@repo/shared';

export { ProductStatus };

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Index({ unique: true })
  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'short_description', type: 'text', nullable: true })
  shortDescription: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price: number;

  @Column({
    name: 'compare_at_price',
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  compareAtPrice: number | null;

  @Column({
    name: 'cost_price',
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  costPrice: number | null;

  @Index({ unique: true })
  @Column({ unique: true, nullable: true, type: 'varchar' })
  sku: string | null;

  @Column({ nullable: true, type: 'varchar' })
  barcode: string | null;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ name: 'low_stock_threshold', type: 'int', default: 5 })
  lowStockThreshold: number;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.DRAFT,
  })
  status: ProductStatus;

  @Column({ nullable: true, type: 'varchar' })
  category: string | null;

  @Column({ nullable: true, type: 'varchar' })
  brand: string | null;

  @Column({ name: 'weight_grams', type: 'int', nullable: true })
  weightGrams: number | null;

  @Column({ type: 'jsonb', default: [] })
  images: string[];

  @Column({ type: 'simple-array', nullable: true })
  tags: string[] | null;

  @Column({ name: 'meta_title', nullable: true, type: 'varchar' })
  metaTitle: string | null;

  @Column({ name: 'meta_description', type: 'text', nullable: true })
  metaDescription: string | null;

  @Column({ name: 'is_featured', default: false })
  isFeatured: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
