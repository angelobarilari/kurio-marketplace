import { expect, type Page } from '@playwright/test'

// MSW intercepts browser fetches; page.request bypasses the service worker.
export const resetMockApi = async (page: Page) => {
  await page.goto('/')
  await expect(page.getByTestId('nft-card')).toHaveCount(9)
  await page.evaluate(() => {
    localStorage.removeItem('kurio:mock-scenario')
    localStorage.removeItem('kurio:visitor-cart')
  })
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const response = await fetch('/api/mock/reset', { method: 'POST' })
        return response.status
      }),
    )
    .toBe(204)
}
