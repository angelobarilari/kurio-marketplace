import { expect, test } from '@playwright/test'

const useMockScenario = async (page: import('@playwright/test').Page, scenario: string) => {
  await page.goto('/')
  await page.evaluate((value) => localStorage.setItem('kurio:mock-scenario', value), scenario)
}
import type { Page } from '@playwright/test'

const dragPriceThumb = async (page: Page, thumbIndex: 0 | 1, targetCents: number) => {
  const slider = page.locator('[data-testid="price-slider"]:visible')
  const thumb = slider.getByRole('slider').nth(thumbIndex)
  await thumb.scrollIntoViewIfNeeded()
  const track = await slider.boundingBox()
  const thumbBox = await thumb.boundingBox()

  if (!track || !thumbBox) throw new Error('Price slider is not visible')

  const min = 2
  const max = 1230
  const ratio = (targetCents - min) / (max - min)
  const targetX = track.x + track.width * ratio
  const targetY = thumbBox.y + thumbBox.height / 2
  const startX = thumbBox.x + thumbBox.width / 2
  const startY = thumbBox.y + thumbBox.height / 2

  await page.mouse.move(startX, startY)
  await page.mouse.down()
  await page.mouse.move(targetX, targetY, { steps: 10 })
  await page.mouse.up()
}

test('catalog has no horizontal overflow at the configured viewport', async ({ page }) => {
  await page.goto('/')
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }))
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport)
})

test('mobile catalog cards align within each grid row', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'))
  await page.goto('/')
  const cards = page.getByTestId('nft-card')
  await expect(cards).toHaveCount(9)

  const cardTops = await cards.evaluateAll((elements) =>
    elements.map((element) => Math.round(element.getBoundingClientRect().top)),
  )

  expect(cardTops[0]).toBe(cardTops[1])
  expect(cardTops[2]).toBe(cardTops[3])
})

test('renders cached mock catalog data while its initial API request is pending', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.setItem('kurio:mock-scenario', 'catalog-slow'))
  const catalogResponse = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/nfts')

  await page.reload()
  await expect(page.getByTestId('nft-card')).toHaveCount(9)
  await expect(page.getByRole('status', { name: 'Carregando NFTs' })).toHaveCount(0)
  expect((await catalogResponse).ok()).toBe(true)
})

test('desktop navigation links use Tailwind utility styles', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'))
  await page.goto('/')

  const navigation = page.getByRole('navigation', { name: 'Navegação principal' })
  const homeLink = navigation.locator('a[href="/"]')
  const disabledLinks = navigation.locator('[aria-disabled="true"]')

  await expect(homeLink).toHaveClass(/flex/)
  await expect(homeLink).toContainClass('text-(--color-primary-bright)')
  await expect(homeLink).toHaveCSS('border-bottom-width', '2px')
  await expect(disabledLinks.first()).toContainClass('text-(--color-muted)')
})

test('shows NFT catalog and applies a category filter to the URL', async ({ page }, testInfo) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', {
      name: testInfo.project.name.includes('mobile')
        ? 'Seja dono da cultura digital'
        : 'Seja dono do futuro da arte digital',
    }),
  ).toBeVisible()
  await expect
    .poll(() =>
      page
        .getByTestId('hero-art')
        .locator('img')
        .evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBeGreaterThan(0)
  await expect(page.getByTestId('nft-card')).toHaveCount(9)

  if (testInfo.project.name.includes('mobile')) {
    await page.getByRole('button', { name: 'Abrir filtros' }).click()
  }

  await page.getByRole('radio', { name: /Arte digital/ }).click()
  await expect(page).toHaveURL(/category=digital-art/)
  await expect(page.getByTestId('nft-card')).toHaveCount(9)

  await page.goBack()
  await expect(page).not.toHaveURL(/category=digital-art/)
  await expect(page.getByTestId('nft-card')).toHaveCount(9)
})

test('category filters preserve scroll and show fixture-backed counts', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'))
  await page.goto('/')

  const marketplace = page.getByRole('region', { name: 'Catálogo de NFTs' })
  await marketplace.scrollIntoViewIfNeeded()
  await page.evaluate(() => window.scrollBy(0, 160))

  const categoryFilters = page.getByRole('heading', { name: 'Coleções' }).locator('..')
  const categoryButtons = categoryFilters.getByRole('radio')

  for (let index = 0; index < (await categoryButtons.count()); index += 1) {
    const categoryButton = categoryButtons.nth(index)
    const categoryCount = Number(
      (await categoryButton.locator('span').nth(1).textContent())?.replace(/\D/g, ''),
    )

    await categoryButton.scrollIntoViewIfNeeded()
    const scrollBeforeFilter = await page.evaluate(() => window.scrollY)
    await categoryButton.click()
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThanOrEqual(scrollBeforeFilter - 1)
    await expect(page.getByTestId('nft-card')).toHaveCount(Math.min(categoryCount, 9))

    if (index === 2) {
      expect(categoryCount).toBe(4)
      await expect(categoryButtons.nth(index)).toContainText('(4)')
    }
  }

  const newestTab = page.getByRole('radiogroup', { name: 'Ordenar destaques' }).getByRole('radio').nth(1)
  await newestTab.scrollIntoViewIfNeeded()
  const scrollBeforeSort = await page.evaluate(() => window.scrollY)
  await newestTab.click()
  await expect(page).toHaveURL(/sort=newest/)
  await expect(newestTab).toHaveAttribute('data-state', 'on')
  await expect(newestTab).not.toHaveCSS('border-bottom-color', 'rgba(0, 0, 0, 0)')
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(scrollBeforeSort - 1)
})

test('search filters the catalog and remains in the URL', async ({ page }, testInfo) => {
  await page.goto('/')
  if (!testInfo.project.name.includes('mobile')) {
    await page.getByRole('button', { name: 'Ir para a busca' }).click()
  }
  const search = page.locator(
    testInfo.project.name.includes('mobile') ? '#mobile-search' : '#header-search-input',
  )

  await search.fill('#042')
  await expect(page).toHaveURL(/q=%23042/)
  await expect(page.getByTestId('nft-card')).toHaveCount(1)
  await expect(page.getByText('Emerald Ape #042')).toBeVisible()
})

test('active URL filters survive refresh and can be cleared together', async ({ page }, testInfo) => {
  await page.goto('/?q=Ape&category=digital-art&network=Ethereum&sort=price-desc&page=2')
  await page.reload()

  if (testInfo.project.name.includes('mobile')) {
    await page.getByRole('button', { name: 'Abrir filtros' }).click()
  }

  const clearFilters = page.getByRole('button', { name: 'Limpar filtros' })
  await expect(clearFilters).toBeVisible()
  await clearFilters.click()

  await expect(page).toHaveURL('/')
  await expect(page.getByTestId('nft-card')).toHaveCount(9)
  await expect(page.getByRole('button', { name: 'Limpar filtros' })).toHaveCount(0)
})

test('catalog cards and facet counts follow each selected network', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'))
  await page.goto('/')

  const categoryFilter = page
    .getByRole('heading', { name: 'Coleções' })
    .locator('..')
    .getByRole('radio')
    .first()
  const networkFilters = page.getByRole('heading', { name: 'Rede' }).locator('..')
  await categoryFilter.click()

  const expectedNetworks = [
    { name: 'Ethereum', total: 5 },
    { name: 'Polygon', total: 6 },
    { name: 'Solana', total: 3 },
  ]

  for (const network of expectedNetworks) {
    const filter = networkFilters.getByRole('radio', { name: new RegExp(network.name) })
    await filter.scrollIntoViewIfNeeded()
    await filter.click()
    await expect(page).toHaveURL(new RegExp('network=' + network.name))
    await expect(page.getByRole('status', { name: 'Carregando NFTs' })).toBeVisible()
    await expect
      .poll(async () =>
        page
          .getByTestId('nft-card')
          .evaluateAll((cards) => cards.map((card) => card.getAttribute('data-network'))),
      )
      .toEqual(Array(network.total).fill(network.name))
    await expect(categoryFilter).toContainText('(' + network.total + ')')
    await expect(filter).toContainText('(' + network.total + ')')
    await expect(filter).toHaveAttribute('aria-checked', 'true')
  }
})

test('facet counts stay visible while the filtered item list reloads', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'))
  await page.goto('/')

  const categoryFilter = page
    .getByRole('heading', { name: 'Coleções' })
    .locator('..')
    .getByRole('radio')
    .first()
  await expect(categoryFilter).toContainText('(14)')
  await categoryFilter.click()

  const ethereumFilter = page
    .getByRole('heading', { name: 'Rede' })
    .locator('..')
    .getByRole('radio', { name: /Ethereum/ })
  await ethereumFilter.click()

  await expect(page.getByRole('status', { name: 'Carregando NFTs' })).toBeVisible()
  await expect(categoryFilter).toContainText('(14)')
  await expect.poll(async () => (await categoryFilter.textContent())?.match(/\((\d+)\)/)?.[1]).toBe('5')
  await expect(page.getByTestId('nft-card')).toHaveCount(5)
})

test('network filters update the cards and preserve the full fixture totals', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'))
  await page.goto('/')
  const networkFilters = page.getByRole('heading', { name: 'Rede' }).locator('..')
  await expect(networkFilters.getByRole('radio', { name: /Ethereum/ })).toContainText('(21)')
  const expectedNetworks = [
    { name: 'Ethereum', total: 21, representative: 'Emerald Ape #042', pages: 3 },
    { name: 'Polygon', total: 18, representative: 'Sage Nomad #009', pages: 2 },
    { name: 'Solana', total: 15, representative: 'Neon Vessel #552', pages: 2 },
  ]

  const allNetworkCounts = await networkFilters
    .getByRole('radio')
    .evaluateAll((buttons) =>
      buttons.map((button) => Number(button.querySelectorAll('span')[1]?.textContent?.replace(/\D/g, ''))),
    )
  expect(allNetworkCounts).toEqual(expectedNetworks.map(({ total }) => total))
  expect(allNetworkCounts.reduce((sum, count) => sum + count, 0)).toBe(54)

  for (const network of expectedNetworks) {
    const filter = networkFilters.getByRole('radio', { name: new RegExp(network.name) })
    await filter.scrollIntoViewIfNeeded()
    await filter.click()
    await expect(page).toHaveURL(new RegExp('network=' + network.name))
    await expect(page.getByRole('status', { name: 'Carregando NFTs' })).toBeVisible()
    await expect
      .poll(async () =>
        page
          .getByTestId('nft-card')
          .evaluateAll((cards) => cards.map((card) => card.getAttribute('data-network'))),
      )
      .toEqual(Array(Math.min(network.total, 9)).fill(network.name))
    await expect(page.getByRole('heading', { name: network.representative })).toBeVisible()
    await expect(
      page.getByRole('navigation', { name: 'Paginação do catálogo' }).getByRole('button'),
    ).toHaveCount(network.pages + 2)
    await expect(filter).toHaveAttribute('aria-checked', 'true')
  }
})

test('network filter keeps the latest selection when earlier responses arrive out of order', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'))
  await useMockScenario(page, 'catalog-out-of-order')
  await page.goto('/')
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))

  const responseOrder = await page.evaluate(async () => {
    const completionOrder: string[] = []
    await Promise.all(
      ['Ethereum', 'Polygon', 'Solana'].map(async (network) => {
        const response = await fetch(`/api/nfts?network=${network}`, {
          headers: { 'x-kurio-mock-scenario': 'catalog-out-of-order' },
        })
        if (!response.ok) throw new Error(`Catalog request failed with status ${response.status}.`)
        await response.json()
        completionOrder.push(network)
      }),
    )
    return completionOrder
  })
  expect(responseOrder).toEqual(['Solana', 'Polygon', 'Ethereum'])

  const networkFilters = page.getByRole('heading', { name: 'Rede' }).locator('..')
  await networkFilters.getByRole('radio', { name: /Ethereum/ }).click()
  await networkFilters.getByRole('radio', { name: /Polygon/ }).click()
  await networkFilters.getByRole('radio', { name: /Solana/ }).click()

  await expect(page).toHaveURL(/network=Solana/)
  await expect
    .poll(async () =>
      page
        .getByTestId('nft-card')
        .evaluateAll((cards) => cards.map((card) => card.getAttribute('data-network'))),
    )
    .toEqual(Array(9).fill('Solana'))
  await expect
    .poll(async () =>
      page
        .getByTestId('nft-card')
        .evaluateAll((cards) => cards.map((card) => card.getAttribute('data-network'))),
    )
    .toEqual(Array(9).fill('Solana'))
})

test('prioritizes above-the-fold catalog images and defers the remaining cards', async ({ page }) => {
  await page.goto('/')

  const images = page.getByTestId('nft-card').locator('img')
  await expect(images.first()).toHaveAttribute('loading', 'eager')
  await expect(images.first()).toHaveAttribute('fetchpriority', 'high')
  await expect(images.nth(1)).toHaveAttribute('loading', 'eager')
  await expect(images.nth(1)).toHaveAttribute('fetchpriority', 'high')
  await expect(images.nth(2)).toHaveAttribute('loading', 'lazy')
})

test('hero keeps mobile highlight controls without an overlapping preview image', async ({
  page,
}, testInfo) => {
  await page.goto('/')

  const heroArtwork = page.getByTestId('hero-art').getByRole('img')
  await expect(heroArtwork).toHaveCount(1)
  await expect(page.getByRole('img', { name: /Próximo destaque:/ })).toHaveCount(0)
  const highlights = page.getByRole('group', { name: 'Destaques do marketplace' })

  if (testInfo.project.name.includes('mobile')) {
    await expect(highlights).toBeVisible()
    const secondHighlight = highlights.getByRole('button', { name: 'Mostrar destaque 2: Sage Nomad' })
    await secondHighlight.click()
    await expect(secondHighlight).toHaveAttribute('aria-pressed', 'true')
    await expect(heroArtwork).toHaveAttribute('alt', 'Arte digital Sage Nomad da coleção Kurio Apes')
  } else {
    await expect(highlights).toBeHidden()
  }
})

test('pagination remains visible while another page is loading', async ({ page }) => {
  await page.goto('/')

  const pagination = page.getByRole('navigation', { name: 'Paginação do catálogo' })
  await pagination.getByRole('button', { name: 'Página 2', exact: true }).click()

  await expect(pagination).toBeVisible()
  await expect(pagination).toHaveAttribute('aria-busy', 'true')
  await expect(pagination.getByRole('button', { name: 'Página 2', exact: true })).toBeDisabled()
  await expect(page).toHaveURL(/page=2/)
  await expect(pagination).toHaveAttribute('aria-busy', 'false')
})

test('promo and journal cards follow the Figma layout', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile') || testInfo.project.name.includes('tablet'))
  await page.goto('/')

  const cards = page.getByTestId('promo-card')
  await expect(cards).toHaveCount(2)
  const actions = cards.getByRole('link', { name: 'Explorar' })
  await expect(actions).toHaveCount(2)
  await expect(actions.first()).toContainClass('bg-(--color-primary)')
  await expect(actions.first()).toContainClass('min-h-9')
  await expect(page.getByRole('link', { name: 'Explorar' }).first()).toContainClass('bg-(--color-primary)')

  const layout = await page.evaluate(() => {
    const cardElements = [...document.querySelectorAll<HTMLElement>('[data-testid="promo-card"]')]
    const actionElements = cardElements.map((element) => element.querySelector<HTMLElement>('a'))
    const imageElements = cardElements.map((element) => element.querySelector('img'))
    const contentElements = cardElements.map((element) => element.querySelector<HTMLElement>('div'))
    return {
      cardHeights: cardElements.map((element) => element.getBoundingClientRect().height),
      actionTops: actionElements.map((element) => element?.getBoundingClientRect().top ?? 0),
      imageSizes: imageElements.map((element) => ({
        width: element?.getBoundingClientRect().width,
        height: element?.getBoundingClientRect().height,
        borderRadius: getComputedStyle(element!).borderRadius,
        left: element?.getBoundingClientRect().left ?? 0,
      })),
      cardLefts: cardElements.map((element) => element.getBoundingClientRect().left),
      textAlignments: contentElements.map((element) => getComputedStyle(element!).textAlign),
    }
  })

  expect(Math.abs(layout.cardHeights[0] - layout.cardHeights[1])).toBeLessThanOrEqual(1)
  expect(Math.abs(layout.actionTops[0] - layout.actionTops[1])).toBeLessThanOrEqual(1)
  expect(layout.imageSizes.map(({ width }) => width)).toEqual([292, 292])
  expect(layout.imageSizes.map(({ height }) => height)).toEqual([250, 250])
  expect(layout.imageSizes.map(({ borderRadius }) => borderRadius)).toEqual(['18px', '18px'])
  expect(layout.imageSizes.map(({ left }, index) => left - layout.cardLefts[index])).toEqual([-5, -5])
  expect(layout.textAlignments).toEqual(['right', 'right'])
  await expect(page.getByTestId('journal-card')).toHaveCount(4)
})

test('promo cards remain spacious at tablet width', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('tablet'))
  await page.goto('/')

  const cards = page.getByTestId('promo-card')
  await expect(cards).toHaveCount(2)
  const cardWidths = await cards.evaluateAll((elements) =>
    elements.map((element) => element.getBoundingClientRect().width),
  )
  expect(cardWidths.every((width) => width > 600)).toBe(true)
  await expect(page.getByTestId('journal-card')).toHaveCount(4)
})

test('price range slider applies the selected values and survives URL navigation', async ({
  page,
}, testInfo) => {
  await page.goto('/')
  if (testInfo.project.name.includes('mobile')) {
    await page.getByRole('button', { name: 'Abrir filtros' }).click()
  }

  const priceFilter = page.locator('[data-testid="price-filter"]:visible')
  const slider = priceFilter.getByTestId('price-slider')
  await expect(slider.getByRole('slider')).toHaveCount(2)
  await expect(priceFilter.getByText(/Preço:/)).toContainText('0,02 - 12,30 ETH')

  await dragPriceThumb(page, 0, 150)
  await dragPriceThumb(page, 1, 200)
  await expect(priceFilter.getByText(/Preço:/)).toContainText('1,50 - 2,00 ETH')
  await priceFilter.getByRole('button', { name: 'Aplicar' }).click()

  await expect(page).toHaveURL(/minPriceEth=%221.50%22/)
  await expect(page).toHaveURL(/maxPriceEth=%222.00%22/)
  await expect(page.getByTestId('nft-card')).toHaveCount(3)

  await page.goBack()
  await expect(page).not.toHaveURL(/maxPriceEth=%222.00%22/)
})

test('price ordering uses the filtered NFT prices', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'))
  await page.goto('/')

  await page.getByRole('combobox', { name: 'Ordenar por' }).click()
  await page.getByRole('option', { name: 'Menor preço' }).click()
  await expect(page).toHaveURL(/sort=price-asc/)
  await expect(page.getByTestId('nft-card-details').getByText('0.32 ETH').first()).toBeVisible()
})

test('catalog pagination stays aligned when cards have different title lengths', async ({ page }) => {
  await page.goto('/')
  const firstTitle = page.getByTestId('nft-card-details').getByRole('heading').first()
  await firstTitle.evaluate((title) => {
    title.textContent = 'Violet Nomad Edition 03 #031'
  })
  await expect(firstTitle).toHaveCSS('white-space', 'normal')
  await expect(firstTitle).toHaveCSS('text-overflow', 'clip')
  await expect(firstTitle).toHaveCSS('min-height', '36px')

  const pagination = page.getByRole('navigation', { name: 'Paginação do catálogo' })
  const firstPageTop = await pagination.evaluate(
    (element) => element.getBoundingClientRect().top + window.scrollY,
  )
  await expect(
    pagination.locator('button[aria-current], button[aria-label$="2"], button[aria-label$="3"]'),
  ).toHaveCount(3)
  await expect(pagination.locator('button[aria-label$="4"]')).toHaveCount(1)
  await pagination.getByRole('button').nth(2).focus()
  await page.keyboard.press('Enter')

  await expect(page).toHaveURL(/page=2/)
  await expect(page.getByTestId('nft-card')).toHaveCount(9)
  await expect(pagination.locator('button[aria-current="page"]')).toHaveText('2')
  const secondPageTop = await pagination.evaluate(
    (element) => element.getBoundingClientRect().top + window.scrollY,
  )
  expect(Math.abs(secondPageTop - firstPageTop)).toBeLessThanOrEqual(1)
})

test('catalog pagination reaches the last of six fixture-backed pages', async ({ page }) => {
  await page.goto('/')
  const pagination = page.getByRole('navigation', { name: 'Paginação do catálogo' })
  await expect(pagination).toHaveAttribute('aria-busy', 'false')
  await expect(pagination.locator('button[aria-label$="4"]')).toBeVisible()
  await expect(pagination.locator('button[aria-label$="5"]')).toHaveCount(0)

  for (let pageNumber = 2; pageNumber <= 6; pageNumber += 1) {
    const nextPage = pagination.locator('button').last()
    await nextPage.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(new RegExp('page=' + pageNumber))
    await expect(pagination.locator('button[aria-current="page"]')).toHaveText(String(pageNumber))
    await expect(page.getByTestId('nft-card')).toHaveCount(9)

    if (pageNumber === 4) {
      await expect(pagination.locator('button[aria-label$="5"]')).toBeVisible()
    }
  }

  await expect(pagination.locator('button[aria-label$="6"]')).toBeVisible()
  await expect(pagination.locator('button').last()).toBeDisabled()
})

test('price bounds reject an inverted range from the URL accessibly', async ({ page }, testInfo) => {
  await page.goto('/?minPriceEth=%222%22&maxPriceEth=%221%22')

  await expect(page.getByTestId('invalid-price-range')).toBeVisible()
  if (testInfo.project.name.includes('mobile')) {
    await page.getByRole('button', { name: 'Abrir filtros' }).click()
  }
  await expect(page.getByRole('slider').first()).toBeDisabled()
  await expect(page.getByRole('slider').last()).toBeDisabled()
  await expect(page.getByTestId('nft-card')).toHaveCount(0)
})

test('catalog combines category and ETH slider range', async ({ page }, testInfo) => {
  await page.goto('/')
  if (testInfo.project.name.includes('mobile')) {
    await page.getByRole('button', { name: 'Abrir filtros' }).click()
  }

  await page.getByRole('radio', { name: /Arte digital/ }).click()
  await dragPriceThumb(page, 0, 100)
  await dragPriceThumb(page, 1, 200)
  await page.locator('[data-testid="price-filter"]:visible').getByRole('button', { name: 'Aplicar' }).click()

  await expect(page).toHaveURL(/category=digital-art/)
  await expect(page.getByTestId('nft-card')).toHaveCount(4)
  await expect(page.getByText('Emerald Ape #042')).toBeVisible()
})

test('mobile layout exposes search, filters, and fixed navigation', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'))
  await page.goto('/')

  await expect(page.locator('header')).toBeHidden()
  await expect(page.locator('#mobile-search')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Abrir filtros' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Navegação mobile' })).toBeVisible()

  const pagination = page.getByRole('navigation', { name: 'Paginação do catálogo' })
  const paginationContent = pagination.locator('[data-slot="pagination-content"]')
  const paginationBox = await pagination.boundingBox()
  const contentBox = await paginationContent.boundingBox()
  expect(paginationBox).not.toBeNull()
  expect(contentBox).not.toBeNull()
  expect(Math.abs(contentBox!.width - paginationBox!.width)).toBeLessThanOrEqual(1)

  await page.getByRole('button', { name: 'Abrir filtros' }).click()
  const filtersSheet = page.locator('#mobile-filters')
  await expect(filtersSheet.getByRole('heading', { name: 'Filtrar por coleção' })).toBeVisible()
  await expect(filtersSheet.getByLabel('Ordenar por')).toBeVisible()
  await expect
    .poll(() => filtersSheet.evaluate((element) => getComputedStyle(element).borderTopWidth))
    .toBe('0px')
})

test('mobile hero copy stays clear of the artwork at narrow widths', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'))

  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/')

    const copy = await page.getByTestId('hero-copy').boundingBox()
    const artwork = await page.getByTestId('hero-art').boundingBox()
    expect(copy).not.toBeNull()
    expect(artwork).not.toBeNull()
    expect(copy!.x + copy!.width).toBeLessThanOrEqual(artwork!.x)

    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }))
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport)
  }
})

test('renders a deterministic empty catalog and clears the active scenario', async ({ page }) => {
  await useMockScenario(page, 'catalog-empty')
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Nenhum NFT encontrado' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Limpar filtros' })).toBeVisible()
  await page.evaluate(() => localStorage.removeItem('kurio:mock-scenario'))
  await page.reload()
  await expect(page.getByTestId('nft-card')).toHaveCount(9)
})

test('recovers from a deterministic catalog failure', async ({ page }) => {
  await useMockScenario(page, 'catalog-error')
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Não foi possível carregar o catálogo' })).toBeVisible()
  await page.evaluate(() => localStorage.removeItem('kurio:mock-scenario'))
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.getByTestId('nft-card')).toHaveCount(9)
})
