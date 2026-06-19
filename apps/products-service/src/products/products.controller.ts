import { Controller } from '@nestjs/common';
import {} from '@repo/shared';
import { ProductsService } from './products.service';

@Controller()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}
}
