import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Product } from '../entities/product.entity';
import {
  CreateProductDto,
  PublicProductDto,
  toPublicProduct,
  UpdateProductDto,
} from '@repo/shared';

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

  async findById(id: string): Promise<PublicProductDto> {
    const product = await this.productsRepository.findOneBy({ id });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return toPublicProduct(product);
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

  async delete(id: string): Promise<void> {
    await this.productsRepository.delete(id);
  }
}
