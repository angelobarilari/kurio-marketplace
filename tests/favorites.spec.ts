import { expect, test } from '@playwright/test'

const loginWithGoogle = async (page: import('@playwright/test').Page) => {
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.getByRole('button', { name: 'Continuar com Google' }).click()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.request.post('/api/mock/reset')
  await page.reload()
})

test('opens desktop auth over the NFT and completes the requested favorite after login', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'))
  await page.goto('/nfts/golden-beat-207')

  await page.getByRole('button', { name: /Adicionar Golden Beat.*aos favoritos/ }).click()
  await expect(page).toHaveURL(/\/nfts\/golden-beat-207$/)
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Continuar com Google' }).click()
  await expect(page).toHaveURL(/\/nfts\/golden-beat-207$/)

  const favorite = page.getByRole('button', { name: /Remover Golden Beat.*dos favoritos/ })
  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(favorite).toHaveAttribute('aria-pressed', 'true')
  await expect(favorite).toBeEnabled()

  await page.goto('/profile/favorites')
  await expect(page.getByRole('link', { name: 'Golden Beat #207', exact: true })).toBeVisible()
})

test('completes a home-card favorite after desktop authentication', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'))

  const card = page.getByTestId('nft-card').first()
  await card.getByRole('button').click()
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Continuar com Google' }).click()

  await expect(card.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
})

test('keeps mobile authentication dedicated and completes the requested home favorite', async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'))

  const card = page.getByTestId('nft-card').first()
  await card.getByRole('button').click()
  await expect(page).toHaveURL(/\/login\?returnTo=%2F$/)
  await expect(page.getByRole('heading', { name: 'Entrar', exact: true })).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('button', { name: 'Continuar com Google' }).click()

  await expect(page).toHaveURL('/')
  await expect(card.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
})

test('shows an error when the requested favorite fails after authentication', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'))
  await page.evaluate(() => localStorage.setItem('kurio:mock-scenario', 'favorite-error'))

  await page.getByTestId('nft-card').first().getByRole('button').click()
  await page.getByRole('button', { name: 'Continuar com Google' }).click()

  await expect(page.getByRole('alert')).toContainText('atualizar os favoritos')
})

test('rolls an optimistic favorite update back when the API rejects it', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'))
  await page.goto('/nfts/golden-beat-207')
  await loginWithGoogle(page)
  await page.evaluate(() => localStorage.setItem('kurio:mock-scenario', 'favorite-error'))

  const favorite = page.getByRole('button', { name: /Adicionar Golden Beat.*aos favoritos/ })
  await favorite.click()
  await expect(favorite).toHaveAttribute('aria-pressed', 'false')
})
