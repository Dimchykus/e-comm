import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MICROSERVICES, PRODUCTS_PATTERNS } from '@repo/shared';
import { of, throwError } from 'rxjs';
import { ProductsController } from './products.controller';

describe('ProductsController', () => {
  let controller: ProductsController;

  const productsClient = { send: jest.fn() };

  const product = { id: 'product-1', name: 'Widget', price: 19.99, stock: 5 };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        { provide: MICROSERVICES.PRODUCTS_SERVICE, useValue: productsClient },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  it('findAllProducts forwards the query dto', async () => {
    const paginated = { data: [product], total: 1, page: 1, limit: 20 };
    productsClient.send.mockReturnValue(of(paginated));

    await expect(controller.findAllProducts({ page: 1 })).resolves.toEqual(
      paginated,
    );
    expect(productsClient.send).toHaveBeenCalledWith(
      PRODUCTS_PATTERNS.FIND_ALL,
      { page: 1 },
    );
  });

  it('searchProducts forwards the search dto', async () => {
    const paginated = { data: [product], total: 1, page: 1, limit: 20 };
    productsClient.send.mockReturnValue(of(paginated));

    await controller.searchProducts({ q: 'widget' });

    expect(productsClient.send).toHaveBeenCalledWith(PRODUCTS_PATTERNS.SEARCH, {
      q: 'widget',
    });
  });

  it('getProduct sends the product id', async () => {
    productsClient.send.mockReturnValue(of(product));

    await expect(controller.getProduct('product-1')).resolves.toEqual(product);
    expect(productsClient.send).toHaveBeenCalledWith(
      PRODUCTS_PATTERNS.FIND_BY_ID,
      { id: 'product-1' },
    );
  });

  it('updateProduct wraps the id and body in the payload', async () => {
    productsClient.send.mockReturnValue(of(product));

    await controller.updateProduct('product-1', { name: 'New name' });

    expect(productsClient.send).toHaveBeenCalledWith(PRODUCTS_PATTERNS.UPDATE, {
      id: 'product-1',
      data: { name: 'New name' },
    });
  });

  it('updateStock wraps the id and delta in the payload', async () => {
    productsClient.send.mockReturnValue(of(product));

    await controller.updateStock('product-1', { delta: -2 });

    expect(productsClient.send).toHaveBeenCalledWith(
      PRODUCTS_PATTERNS.UPDATE_STOCK,
      { id: 'product-1', data: { delta: -2 } },
    );
  });

  it('deleteProduct sends the product id', async () => {
    productsClient.send.mockReturnValue(of(undefined));

    await controller.deleteProduct('product-1');

    expect(productsClient.send).toHaveBeenCalledWith(PRODUCTS_PATTERNS.DELETE, {
      id: 'product-1',
    });
  });

  it('maps RPC errors to HttpExceptions with the original status', async () => {
    productsClient.send.mockReturnValue(
      throwError(() => ({ statusCode: 404, message: 'Product not found' })),
    );

    const promise = controller.getProduct('missing');

    await expect(promise).rejects.toBeInstanceOf(HttpException);
    await promise.catch((err: HttpException) => {
      expect(err.getStatus()).toBe(404);
    });
  });
});
