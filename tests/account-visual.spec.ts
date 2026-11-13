import { expect, test, type Page } from '@playwright/test'

const resetMocks = async (page: Page) => {
  await page.addInitScript(() => localStorage.setItem('kurio:mock-scenario', 'socket-offline'))
  await page.goto('/')
  await page.waitForFunction(() => Boolean(document.querySelector('#root')?.childElementCount))
  await page.evaluate(async () => {
    localStorage.setItem('kurio:mock-scenario', 'socket-offline')
    localStorage.removeItem('kurio:visitor-cart')
    const response = await fetch('/api/mock/reset', { method: 'POST' })
    if (!response.ok) throw new Error(`Mock reset failed with status ${response.status}.`)
  })
}

const signInWithGoogle = async (page: Page, desktop: boolean) => {
  if (desktop) {
    await page.goto('/')
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  } else {
    await page.goto('/login')
  }
  await page.getByRole('button', { name: 'Continuar com Google' }).click()
  if (desktop) await expect(page.getByRole('button', { name: 'Minha conta' })).toBeVisible()
  else await expect(page).toHaveURL('/')
}

test.beforeEach(async ({ page }) => resetMocks(page))

test('captures login and registration at desktop and mobile breakpoints', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes('tablet'))
  const desktop = testInfo.project.name.includes('desktop')
  const viewport = desktop ? 'desktop' : 'mobile'

  if (desktop) {
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(page).toHaveScreenshot(`auth-login-${viewport}.png`, {
      animations: 'disabled',
      fullPage: true,
      caret: 'hide',
    })

    await dialog
      .locator('[aria-label="Modo de acesso"]')
      .getByRole('button', { name: 'Criar conta', exact: true })
      .click()
    await expect(dialog.getByRole('heading', { name: 'Criar perfil de colecionador' })).toBeAttached()
    await expect(page).toHaveScreenshot(`auth-register-${viewport}.png`, {
      animations: 'disabled',
      fullPage: true,
      caret: 'hide',
    })
    return
  }

  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Entrar', exact: true })).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page).toHaveScreenshot(`auth-login-${viewport}.png`, {
    animations: 'disabled',
    fullPage: true,
    caret: 'hide',
  })

  await page.getByRole('link', { name: 'Crie uma conta' }).click()
  await expect(page.getByRole('heading', { name: 'Criar perfil de colecionador' })).toBeAttached()
  await expect(page).toHaveScreenshot(`auth-register-${viewport}.png`, {
    animations: 'disabled',
    fullPage: true,
    caret: 'hide',
  })
})

test('captures profile and wallet management at desktop and mobile breakpoints', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name.includes('tablet'))
  const desktop = testInfo.project.name.includes('desktop')
  const viewport = desktop ? 'desktop' : 'mobile'

  await signInWithGoogle(page, desktop)
  await page.goto('/profile')
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
  await expect(page).toHaveScreenshot(`profile-${viewport}.png`, {
    animations: 'disabled',
    fullPage: true,
    caret: 'hide',
  })

  await page.goto('/profile/wallets')
  await expect(page.getByRole('heading', { name: 'Carteira principal' })).toBeVisible()
  await expect(page).toHaveScreenshot(`wallets-${viewport}.png`, {
    animations: 'disabled',
    fullPage: true,
    caret: 'hide',
  })
})
