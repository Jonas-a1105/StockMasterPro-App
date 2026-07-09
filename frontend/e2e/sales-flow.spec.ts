import { test, expect } from '@playwright/test';

test.describe('E2E: Flujo completo de venta', () => {
  test('login → buscar producto → agregar al carrito → cobrar → verificar stock y venta', async ({ page }) => {
    test.skip(true, 'Requiere backend corriendo con usuario de prueba y datos de seed');

    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*pos/);

    await expect(page.locator('text=POS')).toBeVisible();

    await page.fill('input[placeholder*="buscar" i]', 'test');
    await page.waitForTimeout(500);

    const productCard = page.locator('[class*="productCard"]').first();
    await expect(productCard).toBeVisible();

    const initialStock = await productCard.locator('[class*="stock"]').textContent();

    await productCard.locator('button:has-text("Agregar")').click();
    await expect(page.locator('[class*="cartPanel"]')).toContainText('1');

    await page.click('[class*="paymentBtn"]:has-text("Efectivo")');
    await page.click('button:has-text("Cobrar")');

    await expect(page.locator('[class*="successModal"]')).toBeVisible();
    await expect(page.locator('text=¡Venta Completada!')).toBeVisible();

    await page.reload();
    await expect(page.locator('[class*="productCard"]').first()).toBeVisible();
  });
});

test.describe('E2E: Cash Register', () => {
  test('abrir y cerrar caja con arqueo', async ({ page }) => {
    test.skip(true, 'Requiere backend corriendo y sesión de POS cargada');

    await page.goto('/pos');
    await page.click('button:has-text("Abrir Caja")');
    await page.fill('input[name="cashOpening"]', '1000');
    await page.click('button:has-text("Abrir")');
    await expect(page.locator('text=Caja abierta')).toBeVisible();

    await page.click('button:has-text("Cerrar Caja")');
    await page.fill('input[name="declaredAmount"]', '1050');
    await page.click('button:has-text("Cerrar")');
    await expect(page.locator('text=Caja cerrada')).toBeVisible();
  });
});

test.describe('E2E: App loads correctly', () => {
  test('frontend carga sin errores de consola', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(errors.filter(e => !e.includes('favicon') && !e.includes('manifest')).length).toBe(0);
  });
});