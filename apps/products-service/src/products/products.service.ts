import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';

import { Product } from '../entities/product.entity';
import {
  CreateProductDto,
  FindAllProductsDto,
  PaginatedProductsDto,
  PublicProductDto,
  SearchProductsDto,
  toPublicProduct,
  UpdateProductDto,
} from '@repo/shared';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async findAll(
    findAllProductsDto: FindAllProductsDto,
  ): Promise<PaginatedProductsDto> {
    const {
      page = 1,
      limit = 20,
      status,
      category,
      brand,
      isFeatured,
    } = findAllProductsDto;

    const where: FindOptionsWhere<Product> = {};
    if (status !== undefined) where.status = status;
    if (category !== undefined) where.category = category;
    if (brand !== undefined) where.brand = brand;
    if (isFeatured !== undefined) where.isFeatured = isFeatured;

    const [products, total] = await this.productsRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data: products.map(toPublicProduct), total, page, limit };
  }

  async findById(id: string): Promise<PublicProductDto> {
    const product = await this.productsRepository.findOneBy({ id });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return toPublicProduct(product);
  }

  async search(
    searchProductsDto: SearchProductsDto,
  ): Promise<PaginatedProductsDto> {
    const { q, page = 1, limit = 20 } = searchProductsDto;

    const [products, total] = await this.productsRepository.findAndCount({
      where: [{ name: ILike(`%${q}%`) }, { description: ILike(`%${q}%`) }],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data: products.map(toPublicProduct), total, page, limit };
  }

  async create(createProductDto: CreateProductDto): Promise<PublicProductDto> {
    const product = this.productsRepository.create(createProductDto);
    const savedProduct = await this.productsRepository.save(product);

    return toPublicProduct(savedProduct);
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<PublicProductDto> {
    const product = await this.productsRepository.update(id, updateProductDto);

    if (product.affected === 0) {
      throw new NotFoundException('Product not found');
    }

    return this.findById(id);
  }

  async updateStock(id: string, delta: number): Promise<PublicProductDto> {
    const product = await this.productsRepository.findOneBy({ id });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.stock + delta < 0) {
      throw new BadRequestException('Insufficient stock');
    }

    await this.productsRepository.increment({ id }, 'stock', delta);

    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.productsRepository.delete(id);
  }
}
