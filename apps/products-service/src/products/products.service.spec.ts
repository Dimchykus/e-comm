import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductStatus } from '@repo/shared';
import { ProductsService } from './products.service';
import { Product } from '../entities/product.entity';

describe('ProductsService', () => {
  let service: ProductsService;

  const productsRepository = {
    findAndCount: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    increment: jest.fn(),
    delete: jest.fn(),
  };

  const product = Object.assign(new Product(), {
    id: 'product-1',
    name: 'Widget',
    slug: 'widget',
    description: 'A widget',
    price: 19.99,
    stock: 5,
    status: ProductStatus.ACTIVE,
    category: 'gadgets',
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: productsRepository },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  describe('findAll', () => {
    it('returns paginated products with default paging', async () => {
      productsRepository.findAndCount.mockResolvedValue([[product], 1]);

      const result = await service.findAll({});

      expect(productsRepository.findAndCount).toHaveBeenCalledWith({
        where: {},
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 20,
      });
      expect(result).toMatchObject({ total: 1, page: 1, limit: 20 });
      expect(result.data[0]).toMatchObject({ id: 'product-1', name: 'Widget' });
    });

    it('applies filters and pagination', async () => {
      productsRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ page: 3, limit: 10, category: 'gadgets' });

      expect(productsRepository.findAndCount).toHaveBeenCalledWith({
        where: { category: 'gadgets' },
        order: { createdAt: 'DESC' },
        skip: 20,
        take: 10,
      });
    });
  });

  describe('findById', () => {
    it('returns the product when found', async () => {
      productsRepository.findOneBy.mockResolvedValue(product);

      await expect(service.findById('product-1')).resolves.toMatchObject({
        id: 'product-1',
        name: 'Widget',
      });
    });

    it('throws NotFoundException when missing', async () => {
      productsRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('search', () => {
    it('matches name and description and returns paginated results', async () => {
      productsRepository.findAndCount.mockResolvedValue([[product], 1]);

      const result = await service.search({ q: 'widget' });

      const [findArgs] = productsRepository.findAndCount.mock.calls[0] as [
        { where: unknown[] },
      ];
      expect(findArgs.where).toHaveLength(2);
      expect(result.total).toBe(1);
    });
  });

  describe('create', () => {
    it('saves and returns the new product', async () => {
      productsRepository.create.mockReturnValue(product);
      productsRepository.save.mockResolvedValue(product);

      const result = await service.create({
        name: 'Widget',
        slug: 'widget',
        description: 'A widget',
        price: 19.99,
      });

      expect(productsRepository.save).toHaveBeenCalledWith(product);
      expect(result).toMatchObject({ id: 'product-1', price: 19.99 });
    });
  });

  describe('update', () => {
    it('throws NotFoundException when no row was affected', async () => {
      productsRepository.update.mockResolvedValue({ affected: 0 });

      await expect(
        service.update('missing', { name: 'New name' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('updateStock', () => {
    it('increments the stock by the delta', async () => {
      productsRepository.findOneBy
        .mockResolvedValueOnce(product)
        .mockResolvedValueOnce({ ...product, stock: 3 });

      const result = await service.updateStock('product-1', -2);

      expect(productsRepository.increment).toHaveBeenCalledWith(
        { id: 'product-1' },
        'stock',
        -2,
      );
      expect(result.stock).toBe(3);
    });

    it('rejects a delta that would make stock negative', async () => {
      productsRepository.findOneBy.mockResolvedValue(product);

      await expect(service.updateStock('product-1', -6)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(productsRepository.increment).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the product is missing', async () => {
      productsRepository.findOneBy.mockResolvedValue(null);

      await expect(service.updateStock('missing', 1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('deletes the product by id', async () => {
      productsRepository.delete.mockResolvedValue({ affected: 1 });

      await service.delete('product-1');

      expect(productsRepository.delete).toHaveBeenCalledWith('product-1');
    });
  });
});
