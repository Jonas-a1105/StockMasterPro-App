import type { Product, CartItem } from '@types';
import { ProductCard } from './ProductCard';
import styles from '../pages/POSPage.module.css';

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
    <div className={styles.productsGrid}>
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onAdd={onAdd}
          cartItem={cartItems.find(item => item.product.id === product.id)}
        />
      ))}
      {products.length === 0 && (
        <p className={styles.noResults}>No se encontraron productos</p>
      )}
    </div>
  );
}
