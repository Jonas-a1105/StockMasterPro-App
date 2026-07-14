import { ImageContainer } from '@shared/ui';
import type { Product } from '@types';

interface ProductImageProps {
  product: Product;
}

export function ProductImage({ product }: ProductImageProps) {
  return (
    <div className="flex flex-col gap-4">
      <ImageContainer
        src={product.imageUrl}
        alt={product.name}
        aspectRatio="1"
        className="w-full max-w-xs mx-auto"
      />
    </div>
  );
}