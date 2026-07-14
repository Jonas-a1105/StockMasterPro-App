import { Search } from 'lucide-react';
import styles from '../pages/POSPage/POSPage.module.css';

export function ProductSearch({
  searchInputRef,
  search,
  onSearchChange,
}: {
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  search: string;
  onSearchChange: (s: string) => void;
}) {
  return (
    <div className={styles.searchBar}>
      <Search size={18} />
      <input
        type="text"
        ref={searchInputRef}
        className={styles.searchInput}
        placeholder="Buscar producto por nombre o código de barras..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        autoFocus
      />
    </div>
  );
}
