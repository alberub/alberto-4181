import { test, expect, type Page } from '@playwright/test';
async function register(page: Page) {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/acceso/);
  await page.screenshot({
    path: `test-results/access-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.getByLabel('Nombre completo').fill('Ana Demo');
  await page.getByLabel('Correo electrónico').fill('ana@example.com');
  await page.getByLabel('Contraseña', { exact: true }).fill('clave-demo-12345');
  await page.getByLabel('Confirmar contraseña').fill('clave-demo-12345');
  await page.getByRole('button', { name: 'Crear mi cuenta' }).click();
  await expect(page.getByRole('heading', { name: 'Hola, Ana.' })).toBeVisible();
}
async function openPayment(page: Page) {
  await page.getByRole('button', { name: 'Cargar saldo', exact: true }).first().click();
  await expect(page).toHaveURL(/dashboard$/);
  await expect(page.getByRole('dialog', { name: 'Cargar saldo con SnailPay' })).toBeVisible();
  await expect(page.getByLabel('Monto de la recarga')).toBeVisible();
  await page.screenshot({
    path: `test-results/payment-${test.info().project.name}.png`,
    fullPage: true,
  });
}
test('account lifecycle, successful payment, persistence and logout', async ({ page }) => {
  await register(page);
  const accountButton = page.getByRole('button', { name: /Ana Demo/ });
  await expect(accountButton).toBeVisible();
  await expect(page.locator('.topbar')).toHaveCount(0);
  await expect(page.getByText('Experiencia de demostración')).toHaveCount(0);
  await expect(page.getByTestId('balance')).toHaveText('$0.00');
  await expect(page.getByRole('img', { name: '4 apuestas ganadas y 2 perdidas' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Victorias por caracol' })).toBeVisible();
  await page.mouse.move(0, 0);
  await page.screenshot({
    path: `test-results/dashboard-${test.info().project.name}.png`,
    fullPage: true,
  });
  await openPayment(page);
  await page.getByRole('button', { name: 'Recargar $200.00', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText(
    'Recarga aprobada. Tu saldo ya está actualizado.',
  );
  await page.getByRole('button', { name: 'Listo, volver al dashboard' }).click();
  await expect(page.getByTestId('balance')).toHaveText('$200.00');
  await page.reload();
  await expect(page.getByTestId('balance')).toHaveText('$200.00');
  await page.getByRole('link', { name: 'Cargar saldo', exact: true }).click();
  await expect(page.getByText('Aprobada', { exact: true })).toBeVisible();
  await expect(page.getByTestId('payment-balance')).toHaveText('$200.00');
  await page.screenshot({
    path: `test-results/payment-page-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.getByRole('button', { name: '$100', exact: true }).click();
  await page.getByRole('button', { name: 'Recargar $100.00', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('aprobada');
  await page.getByRole('button', { name: 'Volver al dashboard', exact: true }).click();
  await expect(page.getByTestId('balance')).toHaveText('$300.00');

  await accountButton.click();
  await expect(page.getByRole('dialog', { name: 'Opciones de cuenta' })).toBeVisible();
  await page.screenshot({
    path: `test-results/account-menu-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Cerrar opciones de cuenta' }).click();
  await expect(page.getByRole('dialog', { name: 'Opciones de cuenta' })).toHaveCount(0);
  await accountButton.click();
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/acceso/);
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/acceso/);
  await page.getByLabel('Correo electrónico').fill('ana@example.com');
  await page.getByLabel('Contraseña', { exact: true }).fill('incorrecta');
  await page.getByRole('button', { name: 'Entrar al club' }).click();
  await expect(page.getByRole('alert')).toContainText('no son correctos');
  await page.getByLabel('Contraseña', { exact: true }).fill('clave-demo-12345');
  await page.getByRole('button', { name: 'Entrar al club' }).click();
  await expect(page.getByTestId('balance')).toHaveText('$300.00');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
test('decline, system failure, timeout and network failure never credit the wallet', async ({
  page,
}) => {
  await register(page);
  await openPayment(page);
  const cases = [
    ['declined', 'fue rechazada'],
    ['system_error', 'no está disponible'],
    ['timeout', 'tardó demasiado'],
  ];
  for (const [scenario, expected] of cases) {
    await page.getByLabel('Escenario de prueba').selectOption(scenario);
    await page.getByRole('button', { name: 'Recargar $200.00', exact: true }).click();
    if (scenario === 'timeout') {
      await expect(page.getByRole('button', { name: 'Cerrar recarga' })).toBeDisabled();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toBeVisible();
    }
    await expect(page.getByRole('alert')).toContainText(expected);
    await expect(page.getByTestId('payment-balance')).toHaveText('$0.00');
  }
  await page.getByLabel('Escenario de prueba').selectOption('approved');
  await page.route('**/api/snailpay/payments', (route) => route.abort('failed'));
  await page.getByRole('button', { name: 'Recargar $200.00', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('No pudimos conectar');
  await expect(page.getByTestId('payment-balance')).toHaveText('$0.00');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Cargar saldo', exact: true })).toBeFocused();
  await page.reload();
  await expect(page.getByTestId('balance')).toHaveText('$0.00');
});
test('corrupt storage is reported without silently deleting the account', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('snail-club:v1', '{broken'));
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('dañados');
  expect(await page.evaluate(() => localStorage.getItem('snail-club:v1'))).toBe('{broken');
});

test('another tab sees the updated wallet and logout across views', async ({ page, context }) => {
  await register(page);
  const other = await context.newPage();
  await other.goto('/dashboard');
  await expect(other.getByTestId('balance')).toHaveText('$0.00');
  await openPayment(page);
  const modal = page.getByRole('dialog');
  await page.keyboard.press('Shift+Tab');
  expect(await modal.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  const modalContent = modal.getByRole('region', { name: 'Recarga de saldo' });
  await modalContent.evaluate((element) => (element.scrollTop = element.scrollHeight));
  await expect(page.getByRole('button', { name: 'Cerrar recarga' })).toBeInViewport();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Cargar saldo', exact: true })).toBeFocused();
  await openPayment(page);
  await page.getByRole('button', { name: 'Recargar $200.00', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('aprobada');
  await expect(other.getByTestId('balance')).toHaveText('$200.00');
  await page.getByRole('button', { name: 'Listo, volver al dashboard' }).click();
  await other.getByRole('button', { name: /Ana Demo/ }).click();
  await other.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/acceso/);
  await expect(other).toHaveURL(/acceso/);
});

test('full-screen shell keeps brand and account fixed while views scroll independently', async ({
  page,
}) => {
  await register(page);
  const dimensions = await page.evaluate(() => ({
    shell: document.querySelector('.app-shell')!.getBoundingClientRect().toJSON(),
    sidebar: document.querySelector('.sidebar')!.getBoundingClientRect().toJSON(),
    viewport: { width: innerWidth, height: innerHeight },
  }));
  expect(dimensions.shell.width).toBeCloseTo(dimensions.viewport.width, 0);
  expect(dimensions.shell.height).toBeCloseTo(dimensions.viewport.height, 0);
  const brand = page.locator('.sidebar .brand');
  const accountButton = page.getByRole('button', { name: /Ana Demo/ });
  const brandTop = await brand.evaluate((element) => element.getBoundingClientRect().top);
  const accountTop = await accountButton.evaluate((element) => element.getBoundingClientRect().top);
  const main = page.locator('.dashboard');
  await main.evaluate((element) => (element.scrollTop = element.scrollHeight));
  expect(await brand.evaluate((element) => element.getBoundingClientRect().top)).toBe(brandTop);
  expect(await accountButton.evaluate((element) => element.getBoundingClientRect().top)).toBe(
    accountTop,
  );
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  const navigation = page.getByRole('navigation', { name: 'Navegación principal' });
  await expect(navigation.getByRole('link')).toHaveCount(2);
  await navigation.getByRole('link', { name: 'Cargar saldo', exact: true }).click();
  await expect(page).toHaveURL(/recargar$/);
  await expect(page.getByLabel('Monto de la recarga')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Historial de recargas' })).toBeVisible();
  if (test.info().project.name === 'desktop') {
    await page.setViewportSize({ width: 1280, height: 560 });
  }
  const fixedBrand = await brand.evaluate((element) => element.getBoundingClientRect().top);
  const fixedAccount = await accountButton.evaluate(
    (element) => element.getBoundingClientRect().top,
  );
  const content = page.locator('.dashboard');
  expect(await content.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(
    true,
  );
  await content.evaluate((element) => (element.scrollTop = element.scrollHeight));
  expect(await brand.evaluate((element) => element.getBoundingClientRect().top)).toBe(fixedBrand);
  expect(await accountButton.evaluate((element) => element.getBoundingClientRect().top)).toBe(
    fixedAccount,
  );
  for (const route of ['/apuestas', '/estadisticas', '/carreras', '/caracoles', '/movimientos']) {
    await page.goto(route);
    await expect(page).toHaveURL(/dashboard$/);
    await expect(page.getByRole('img', { name: '4 apuestas ganadas y 2 perdidas' })).toBeVisible();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
