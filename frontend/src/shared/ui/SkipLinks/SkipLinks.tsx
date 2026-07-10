export function SkipLinks() {
  return (
    <nav className={styles.skipLinks} aria-label="Enlaces de salto">
      <a href="#main-content" className={styles.skipLink}>
        Saltar al contenido principal
      </a>
      <a href="#main-navigation" className={styles.skipLink}>
        Saltar a la navegación principal
      </a>
      <a href="#search" className={styles.skipLink}>
        Saltar a la búsqueda
      </a>
    </nav>
  );
}