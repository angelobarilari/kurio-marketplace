import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import {
  changePasswordState,
  createWalletState,
  getProfileState,
  getSessionState,
  getWalletsState,
  loginState,
  logoutState,
  registerState,
  socialLoginState,
  updateAvatarState,
  updateProfileState,
  updateWalletState,
} from '@/mocks/state/account-store'
import type { WalletInput } from '@/types/account'

const walletInput: WalletInput = {
  displayName: 'Test wallet',
  alias: 'Test',
  network: 'Ethereum',
  address: '0xunique-wallet',
  provider: 'MetaMask',
  ensName: null,
  priority: 'primary',
}

describe('Account state', () => {
  it('updates the signed-in profile and rejects identifiers owned by another user', () => {
    socialLoginState('google')
    const profile = getProfileState()
    assert.ok(profile)
    const input = {
      displayName: 'Nova Collector',
      username: 'nova',
      email: 'nova@kurio.example',
      ensName: 'nova.collector.eth',
      walletAlias: 'Cold storage',
    }

    assert.deepEqual(updateProfileState({ ...input, email: 'caio@kurio.example' }), { conflict: 'email' })
    assert.deepEqual(updateProfileState({ ...input, username: 'caio' }), { conflict: 'username' })

    const updated = updateProfileState({
      ...input,
      email: ' NewNova@Example.com ',
      username: ' NewNova ',
    })
    assert.ok(updated && !('conflict' in updated))
    assert.equal(updated.email, 'newnova@example.com')
    assert.equal(updated.username, 'newnova')
    assert.equal(getSessionState()?.user.email, updated.email)
    assert.equal(getSessionState()?.user.username, updated.username)
  })

  it('changes a password only with the current password and invalidates the old one', async () => {
    const credentials = {
      email: 'password@example.com',
      username: 'password-user',
      password: 'InitialPass123!',
      passwordConfirmation: 'InitialPass123!',
    }
    const session = await registerState(credentials)
    assert.ok('user' in session)

    assert.equal(
      await changePasswordState({
        currentPassword: 'wrong-password',
        newPassword: 'UpdatedPass123!',
        passwordConfirmation: 'UpdatedPass123!',
      }),
      'invalid-current-password',
    )
    assert.equal(
      await changePasswordState({
        currentPassword: credentials.password,
        newPassword: 'UpdatedPass123!',
        passwordConfirmation: 'UpdatedPass123!',
      }),
      'updated',
    )
    logoutState()
    assert.equal(await loginState({ email: credentials.email, password: credentials.password }), null)
    assert.ok(await loginState({ email: credentials.email, password: 'UpdatedPass123!' }))
  })

  it('keeps wallet addresses unique and demotes other wallets when setting a primary', () => {
    socialLoginState('google')
    const initialWallets = getWalletsState()
    assert.ok(initialWallets)

    const created = createWalletState(walletInput)
    assert.ok(created && !('conflict' in created))
    assert.equal(created.priority, 'primary')
    assert.ok(
      getWalletsState()
        ?.filter((wallet) => wallet.id !== created.id)
        .every((wallet) => wallet.priority === 'secondary'),
    )
    assert.deepEqual(createWalletState({ ...walletInput, address: walletInput.address.toUpperCase() }), {
      conflict: true,
    })
    assert.equal(updateWalletState('missing-wallet', walletInput), 'not-found')
    assert.deepEqual(updateWalletState(created.id, { ...walletInput, address: initialWallets[0].address }), {
      conflict: true,
    })

    const updated = updateWalletState(created.id, { ...walletInput, address: '0xupdated-wallet' })
    assert.ok(updated && updated !== 'not-found' && !('conflict' in updated))
    assert.equal(updated.priority, 'primary')
    assert.ok(
      getWalletsState()
        ?.filter((wallet) => wallet.id !== created.id)
        .every((wallet) => wallet.priority === 'secondary'),
    )
  })

  it('keeps the existing primary wallet when adding or updating a secondary wallet', () => {
    socialLoginState('google')
    const primary = getWalletsState()?.find((wallet) => wallet.priority === 'primary')
    assert.ok(primary)

    const created = createWalletState({
      ...walletInput,
      address: '0xsecondary-wallet',
      priority: 'secondary',
    })
    assert.ok(created && !('conflict' in created))
    assert.equal(created.priority, 'secondary')
    assert.equal(getWalletsState()?.find((wallet) => wallet.id === primary.id)?.priority, 'primary')

    const updated = updateWalletState(created.id, {
      ...walletInput,
      address: '0xupdated-secondary-wallet',
      priority: 'secondary',
    })
    assert.ok(updated && updated !== 'not-found' && !('conflict' in updated))
    assert.equal(updated.priority, 'secondary')
    assert.equal(getWalletsState()?.find((wallet) => wallet.id === primary.id)?.priority, 'primary')
  })

  it('denies private account changes without an authenticated session', async () => {
    assert.equal(getProfileState(), null)
    assert.equal(getWalletsState(), null)
    assert.equal(
      updateProfileState({
        displayName: 'Guest',
        username: 'guest',
        email: 'guest@example.com',
        ensName: null,
        walletAlias: '',
      }),
      null,
    )
    assert.equal(updateAvatarState({ avatarUrl: 'https://example.test/avatar.png' }), null)
    assert.equal(
      await changePasswordState({
        currentPassword: 'current',
        newPassword: 'next',
        passwordConfirmation: 'next',
      }),
      null,
    )
    assert.equal(createWalletState(walletInput), null)
    assert.equal(updateWalletState('wallet-id', walletInput), null)
  })
})
