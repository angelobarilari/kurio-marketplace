import { expect, test, type Page } from '@playwright/test'

const registerAccount = async (
  page: Page,
  account = { username: 'collector', email: 'collector@kurio.example', password: 'Kurio1234' },
) => {
  await page.goto('/register')
  await page.getByPlaceholder('Nome de usuário').fill(account.username)
  await page.getByPlaceholder('contato@email.com').fill(account.email)
  await page.getByPlaceholder('Senha', { exact: true }).fill(account.password)
  await page.getByPlaceholder('Confirmar senha').fill(account.password)
  await page.locator('form').getByRole('button', { name: 'Criar conta', exact: true }).click()
  await expect(page).toHaveURL('/')
}

const logout = async (page: Page) => {
  await page.getByRole('button', { name: 'Minha conta' }).click()
  await page.getByRole('button', { name: 'Sair' }).last().click()
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('button', { name: 'Entrar', exact: true }).first()).toBeVisible()
}

test('covers registration, valid and invalid login, refresh, logout, and session expiration', async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.includes('desktop'))
  await registerAccount(page)
  await page.reload()
  await expect(page.getByRole('button', { name: 'Minha conta' })).toBeVisible()
  await logout(page)

  await page.goto('/login')
  await page.getByPlaceholder('contato@email.com').fill('collector@kurio.example')
  await page.getByPlaceholder('Senha').fill('incorreta')
  await page.locator('form').getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('E-mail ou senha incorretos')

  await page.getByPlaceholder('Senha').fill('Kurio1234')
  await page.locator('form').getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL('/')
  await page.evaluate(() => localStorage.setItem('kurio:mock-scenario', 'session-expired'))
  await page.goto('/profile')
  await page.reload()
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fprofile/)
})

test('reports registration conflicts and resets password recovery state when reopened', async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.includes('desktop'))
  await page.goto('/register')
  await page.getByPlaceholder('Nome de usuário').fill('nova-copy')
  await page.getByPlaceholder('contato@email.com').fill('nova@kurio.example')
  await page.getByPlaceholder('Senha', { exact: true }).fill('Kurio1234')
  await page.getByPlaceholder('Confirmar senha').fill('Kurio1234')
  await page.locator('form').getByRole('button', { name: 'Criar conta', exact: true }).click()
  await expect(page.getByText('Este e-mail já está cadastrado.')).toBeVisible()

  await page.goto('/')
  const trigger = page.getByRole('button', { name: 'Entrar', exact: true })
  await trigger.click()
  await page.getByPlaceholder('contato@email.com').fill('unknown@kurio.example')
  await page.getByRole('button', { name: 'Esqueceu a senha?' }).click()
  await expect(page.getByRole('status')).toContainText('Se existir uma conta')
  await page.getByRole('button', { name: 'Fechar' }).click()
  await trigger.click()
  await expect(page.getByRole('button', { name: 'Esqueceu a senha?' })).toBeVisible()
})

test('persists profile, avatar, and password updates after refresh', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('desktop'))
  await registerAccount(page)
  await page.goto('/profile')

  const displayName = page.getByLabel(/Nome de exibição/)
  await displayName.fill('Colecionador Kurio')
  await page.getByLabel(/Apelido público/).fill('Principal')
  await page.getByRole('button', { name: 'Salvar perfil' }).click()
  await expect(
    page
      .locator('form')
      .filter({ has: page.getByRole('button', { name: 'Salvar perfil' }) })
      .getByRole('status'),
  ).toContainText('Dados do perfil salvos.')

  await page.locator('input[type="file"]').setInputFiles({
    name: 'avatar.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('not an image'),
  })
  await expect(page.getByRole('alert')).toContainText('Use uma imagem PNG, JPEG ou WebP.')

  await page.locator('input[type="file"]').setInputFiles({
    name: 'avatar.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=',
      'base64',
    ),
  })
  await expect(page.getByRole('img', { name: 'Avatar atual' })).toBeVisible()

  await page.getByLabel('Senha atual').fill('Kurio1234')
  await page.getByLabel('Nova senha', { exact: true }).fill('NovaKurio123')
  await page.getByLabel('Confirmar nova senha').fill('SenhaDiferente123')
  await page.getByRole('button', { name: 'Salvar senha' }).click()
  await expect(page.getByText('As senhas não coincidem.')).toBeVisible()

  await page.getByLabel('Confirmar nova senha').fill('NovaKurio123')
  await page.getByLabel('Senha atual').fill('senha-incorreta')
  await page.getByRole('button', { name: 'Salvar senha' }).click()
  await expect(
    page
      .locator('form')
      .filter({ has: page.getByRole('button', { name: 'Salvar senha' }) })
      .getByRole('status'),
  ).toContainText('A senha atual está incorreta.')

  await page.getByLabel('Senha atual').fill('Kurio1234')
  await page.getByRole('button', { name: 'Salvar senha' }).click()
  await expect(
    page
      .locator('form')
      .filter({ has: page.getByRole('button', { name: 'Salvar senha' }) })
      .getByRole('status'),
  ).toContainText('Senha alterada com sucesso.')

  await page.reload()
  await expect(displayName).toHaveValue('Colecionador Kurio')
  await expect(page.getByRole('img', { name: 'Avatar atual' })).toBeVisible()
  await logout(page)
  await page.goto('/login')
  await page.getByPlaceholder('contato@email.com').fill('collector@kurio.example')
  await page.getByPlaceholder('Senha').fill('NovaKurio123')
  await page.locator('form').getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL('/')
})

test('aligns the avatar beside the public alias on desktop', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('desktop'))
  await registerAccount(page)
  await page.goto('/profile')

  const aliasField = page.getByLabel(/Apelido público/).locator('..')
  const avatarField = page.getByRole('group', { name: 'Avatar' })
  const aliasBox = await aliasField.boundingBox()
  const avatarBox = await avatarField.boundingBox()
  expect(aliasBox).not.toBeNull()
  expect(avatarBox).not.toBeNull()
  expect(Math.abs(aliasBox!.y - avatarBox!.y)).toBeLessThanOrEqual(1)
  expect(avatarBox!.x).toBeGreaterThan(aliasBox!.x + aliasBox!.width)
})

test('creates and persists a wallet without exposing it to another user', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('desktop'))
  await registerAccount(page)
  await page.goto('/profile/wallets')
  await page.getByLabel(/Nome de exibição/).fill('Principal')
  await page.getByLabel(/Apelido da carteira/).fill('Reserva')
  await page.getByLabel(/Endereço da carteira/).fill('0x123')
  await page.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByText('Informe um endereço válido para Ethereum.')).toBeVisible()
  await page.getByLabel(/Endereço da carteira/).fill('0x1111111111111111111111111111111111111111')
  await page.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByRole('status')).toContainText('Carteira salva.')
  await page.reload()
  await expect(page.getByLabel(/Endereço da carteira/)).toHaveValue(
    '0x1111111111111111111111111111111111111111',
  )
  await page.getByLabel(/Apelido da carteira/).fill('Reserva editada')
  await page.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByRole('status')).toContainText('Carteira salva.')
  await page.reload()
  await expect(page.getByLabel(/Apelido da carteira/)).toHaveValue('Reserva editada')

  await logout(page)
  await registerAccount(page, {
    username: 'second-collector',
    email: 'second@kurio.example',
    password: 'Kurio5678',
  })
  await page.goto('/profile/wallets')
  await expect(page.getByLabel(/Endereço da carteira/)).toHaveValue('')
})

test('shows a duplicate wallet address error only below its input', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('desktop'))
  await registerAccount(page, {
    username: 'wallet-owner',
    email: 'wallet-owner@kurio.example',
    password: 'Kurio1234',
  })
  await page.goto('/profile/wallets')

  const primaryForm = page
    .locator('form')
    .filter({ has: page.getByRole('button', { name: 'Salvar carteira' }) })
  const address = '0x1111111111111111111111111111111111111111'
  await primaryForm.getByLabel(/Nome de exibição/).fill('Principal')
  await primaryForm.getByLabel(/Apelido da carteira/).fill('Principal')
  await primaryForm.getByLabel(/Endereço da carteira/).fill(address)
  await primaryForm.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(primaryForm.getByRole('status')).toContainText('Carteira salva.')

  await page.getByRole('button', { name: 'Adicionar', exact: true }).click()
  const secondaryForm = page
    .locator('form')
    .filter({ has: page.getByRole('button', { name: 'Adicionar carteira' }) })
  await secondaryForm.getByLabel(/Nome de exibição/).fill('Secundária')
  await secondaryForm.getByLabel(/Apelido da carteira/).fill('Secundária')
  await secondaryForm.getByLabel(/Endereço da carteira/).fill(address)
  await secondaryForm.getByRole('button', { name: 'Adicionar carteira' }).click()

  await expect(secondaryForm.getByText('Este endereço já está cadastrado.')).toBeVisible()
  await expect(page.getByText('Este endereço já está cadastrado.', { exact: true })).toHaveCount(1)
  await expect(secondaryForm.getByRole('alert')).toHaveCount(1)
  await expect(secondaryForm.getByLabel(/Endereço da carteira/)).toHaveAttribute('aria-invalid', 'true')
})

test('keeps one account section active and fixes wallet dropdown width', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('desktop'))
  await registerAccount(page)

  const nav = page.getByRole('navigation', { name: 'Seções da conta' })
  for (const [path, label] of [
    ['/profile', 'Dados do perfil'],
    ['/profile/wallets', 'Carteiras'],
    ['/profile/favorites', 'Lista de interesse'],
  ]) {
    await page.goto(path)
    const activeLink = nav.locator('a[aria-current="page"]')
    await expect(activeLink).toHaveCount(1)
    await expect(activeLink).toContainText(label)
  }

  await page.goto('/profile/wallets')
  const network = page.getByRole('combobox', { name: 'Rede' })
  const trigger = await network.boundingBox()
  expect(trigger).not.toBeNull()
  await network.click()
  const firstDropdown = await page.getByRole('listbox').boundingBox()
  expect(firstDropdown).not.toBeNull()
  await page.getByRole('option', { name: 'Polygon' }).click()

  await network.click()
  const secondDropdown = await page.getByRole('listbox').boundingBox()
  expect(secondDropdown).not.toBeNull()
  expect(Math.abs(firstDropdown!.width - secondDropdown!.width)).toBeLessThanOrEqual(1)
  expect(Math.abs(secondDropdown!.width - trigger!.width)).toBeLessThanOrEqual(1)
})

test('mobile account navigation is vertical and fully accessible', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'))
  await page.goto('/login')
  await page.getByRole('button', { name: 'Continuar com Google' }).click()
  await expect(page).toHaveURL('/')
  await page.goto('/profile/wallets')

  const nav = page.getByRole('navigation', { name: 'Seções da conta' })
  await expect(nav.getByRole('link', { name: 'Dados do perfil' })).toBeVisible()
  await expect(nav.getByRole('link', { name: 'Carteiras' })).toBeVisible()
  await expect(nav.getByRole('link', { name: 'Lista de interesse' })).toBeVisible()
  for (const label of ['Atividade', 'Ofertas', 'Arquivos baixados', 'Suporte']) {
    await expect(nav.getByRole('button', { name: label })).toBeDisabled()
  }
  const enabledItem = await nav.getByRole('link', { name: 'Dados do perfil' }).boundingBox()
  const disabledItem = await nav.getByRole('button', { name: 'Atividade' }).boundingBox()
  const enabledItemIcon = await nav
    .getByRole('link', { name: 'Dados do perfil' })
    .locator('svg')
    .boundingBox()
  const disabledItemIcon = await nav.getByRole('button', { name: 'Atividade' }).locator('svg').boundingBox()
  expect(enabledItem).not.toBeNull()
  expect(disabledItem).not.toBeNull()
  expect(Math.abs(enabledItem!.width - disabledItem!.width)).toBeLessThanOrEqual(1)
  expect(Math.abs(enabledItem!.height - disabledItem!.height)).toBeLessThanOrEqual(1)
  expect(enabledItemIcon).not.toBeNull()
  expect(disabledItemIcon).not.toBeNull()
  expect(Math.abs(enabledItemIcon!.x - disabledItemIcon!.x)).toBeLessThanOrEqual(1)
  const dimensions = await nav.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
    flexDirection: getComputedStyle(element).flexDirection,
  }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  expect(dimensions.flexDirection).toBe('column')
  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page).toHaveURL('/')
  await page.goto('/profile')
  await expect(page).toHaveURL('/login?returnTo=%2Fprofile')
})

test('mobile login and signup use dedicated screens and preserve return destination', async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'))
  await page.goto('/login?returnTo=%2Fcart')

  await expect(page.getByRole('heading', { name: 'Entrar', exact: true })).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('link', { name: 'Crie uma conta' }).click()
  await expect(page).toHaveURL('/register?returnTo=%2Fcart')
  await expect(page.getByRole('heading', { name: 'Criar perfil de colecionador' })).toBeVisible()
  await expect(page.getByPlaceholder('Digite seu e-mail')).toBeVisible()
  await page.getByRole('link', { name: 'Entre', exact: true }).click()
  await expect(page).toHaveURL('/login?returnTo=%2Fcart')
})

test('resets registered accounts and private data to deterministic fixtures', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('desktop'))
  await registerAccount(page, {
    username: 'reset-collector',
    email: 'reset@kurio.example',
    password: 'Kurio5678',
  })

  const resetStatus = await page.evaluate(async () => {
    const response = await fetch('/api/mock/reset', { method: 'POST' })
    return response.status
  })
  expect(resetStatus).toBe(204)
  await page.goto('/login')
  await page.getByPlaceholder('contato@email.com').fill('reset@kurio.example')
  await page.getByPlaceholder('Senha').fill('Kurio5678')
  await page.locator('form').getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('E-mail ou senha incorretos')
})

test('desktop auth dialog traps focus, closes with Escape, and restores focus', async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.includes('desktop'))
  await page.goto('/')
  const trigger = page.getByRole('button', { name: 'Entrar', exact: true })
  await trigger.click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Shift+Tab')
  await expect(page.locator(':focus')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('mobile auth errors are announced and remain in view at 200% zoom', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'))
  await page.goto('/register')
  const email = page.getByPlaceholder('Digite seu e-mail')
  await page.locator('form').getByRole('button', { name: 'Criar perfil', exact: true }).click()
  await expect(email).toHaveAttribute('aria-invalid', 'true')
  await expect(email).toHaveAttribute('aria-describedby', /email-error/)

  const hasHorizontalOverflow = await page.evaluate(() => {
    document.documentElement.style.zoom = '200%'
    return document.documentElement.scrollWidth > window.innerWidth
  })
  expect(hasHorizontalOverflow).toBe(false)
})
