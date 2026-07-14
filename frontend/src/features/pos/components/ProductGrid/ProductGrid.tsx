import type { Product, CartItem } from '@types';
import { PosProductCard } from '@features/pos/components/PosProductCard';

export function ProductGrid({
  products,
  onAdd,
  cartItems,
}: {
  products: Product[];
  onAdd: (product: Product) => void;
  cartItems: CartItem[];
}) {
  return (
    <div className="productsGrid">
      {products.map((product) => {
        const cartItem = cartItems.find((item) => item.product.id === product.id);
        return (
          <PosProductCard
            key={product.id}
            product={product}
            onAdd={onAdd}
            cartQuantity={cartItem?.quantity || 0}
          />
        );
      })}
      {products.length === 0 && <p className="text-center text-text-muted p-8">No se encontraron productos</p>}
    </div>
  );
}
