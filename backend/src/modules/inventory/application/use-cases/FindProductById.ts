import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ProductRepository, PRODUCT_REPOSITORY } from '../ports/ProductRepository.interface';
import { Product } from '../../domain/Product';

@Injectable()
export class FindProductByIdUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepo: ProductRepository,
  ) {}

  async execute(id: string, tenantId: string): Promise<Product> {
    const product = await this.productRepo.findById(id, tenantId);
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }
}
