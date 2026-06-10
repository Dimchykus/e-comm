import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import {
  CreateProductDto,
  FindAllProductsDto,
  SearchProductsDto,
  UpdateProductDto,
  UpdateStockDto,
} from '@repo/shared';
import { Product } from '../entities/product.entity';

export interface PaginatedProducts {
  data: Product[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async create(dto: CreateProductDto): Promise<Product> {
    const conflict = await this.productsRepository.findOne({
      where: [
        { slug: dto.slug },
        ...(dto.sku ? [{ sku: dto.sku }] : []),
      ] as FindOptionsWhere<Product>[],
    });
    if (conflict) {
      throw new RpcException({
        statusCode: 409,
        message:
          conflict.slug === dto.slug
            ? `Product with slug "${dto.slug}" already exists`
            : `Product with SKU "${dto.sku}" already exists`,
      });
    }

    const product = this.productsRepository.create(dto);
    return this.productsRepository.save(product);
  }

  async findAll(query: FindAllProductsDto): Promise<PaginatedProducts> {
    const { page = 1, limit = 20, ...filters } = query;

    const where: FindOptionsWhere<Product> = {};
    if (filters.status) where.status = filters.status;
    if (filters.category) where.category = filters.category;
    if (filters.brand) where.brand = filters.brand;
    if (filters.isFeatured !== undefined) where.isFeatured = filters.isFeatured;

    const [data, total] = await this.productsRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new RpcException({
        statusCode: 404,
        message: `Product with id "${id}" not found`,
      });
    }
    return product;
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

    if (dto.slug && dto.slug !== product.slug) {
      const conflict = await this.productsRepository.findOne({
        where: { slug: dto.slug },
      });
      if (conflict) {
        throw new RpcException({
          statusCode: 409,
          message: `Product with slug "${dto.slug}" already exists`,
        });
      }
    }

    this.productsRepository.merge(product, dto);
    return this.productsRepository.save(product);
  }

  async remove(id: string): Promise<{ id: string; deleted: boolean }> {
    await this.findOne(id);
    await this.productsRepository.softDelete(id);
    return { id, deleted: true };
  }

  async search(query: SearchProductsDto): Promise<PaginatedProducts> {
    const { q, page = 1, limit = 20 } = query;
    const term = ILike(`%${q}%`);

    const [data, total] = await this.productsRepository.findAndCount({
      where: [{ name: term }, { description: term }, { brand: term }],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async updateStock(id: string, dto: UpdateStockDto): Promise<Product> {
    const product = await this.findOne(id);
    const newStock = product.stock + dto.delta;

    if (newStock < 0) {
      throw new RpcException({
        statusCode: 422,
        message: `Insufficient stock: have ${product.stock}, requested change ${dto.delta}`,
      });
    }

    product.stock = newStock;
    return this.productsRepository.save(product);
  }
}
