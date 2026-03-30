import { expect, test } from '@playwright/test'

import {
  cleanupFrontendUser,
  deleteFrontendUserByEmail,
  seedFrontendUser,
  testFrontendUser,
} from '../helpers/seedFrontendUser'

const logoutLabel = /Logout|退出登录/

test.describe('Frontend auth', () => {
  test.beforeAll(async () => {
    await seedFrontendUser()
  })

  test.afterAll(async () => {
    await cleanupFrontendUser()
  })

  test('redirects protected routes to login and returns to the user center after sign in', async ({
    page,
  }) => {
    await page.goto('http://localhost:3000/user/me')

    await expect(page).toHaveURL(/\/login\?next=%2Fuser%2Fme$/)

    const loginPanel = page.locator('div[aria-hidden="false"]').filter({ has: page.locator('form') }).first()

    await loginPanel.locator('input[type="email"]').fill(testFrontendUser.email)
    await loginPanel.locator('input[type="password"]').fill(testFrontendUser.password)
    await loginPanel.locator('form button[type="submit"]').click()

    await expect(page).toHaveURL('http://localhost:3000/user/me')
    await expect(page.getByTestId('write-article-button')).toBeVisible()
    await expect(page.getByText(testFrontendUser.displayName)).toBeVisible()
  })

  test('clears the frontend session on logout', async ({ page }) => {
    await page.goto('http://localhost:3000/login')

    const loginPanel = page.locator('div[aria-hidden="false"]').filter({ has: page.locator('form') }).first()

    await loginPanel.locator('input[type="email"]').fill(testFrontendUser.email)
    await loginPanel.locator('input[type="password"]').fill(testFrontendUser.password)
    await loginPanel.locator('form button[type="submit"]').click()

    await expect(page).toHaveURL('http://localhost:3000/user/me')

    await page.getByRole('button', { name: logoutLabel }).click()

    await expect(page).toHaveURL('http://localhost:3000/user/me')

    await page.goto('http://localhost:3000/user/me')

    await expect(page).toHaveURL(/\/login\?next=%2Fuser%2Fme$/)
  })

  test('registers a new frontend account and signs the user in automatically', async ({ page }) => {
    const nonce = Date.now().toString(36)
    const newUser = {
      displayName: `Register User ${nonce}`,
      email: `register-${nonce}@campusblog.test`,
      password: `register-${nonce}-pass`,
    }

    await deleteFrontendUserByEmail(newUser.email)
    await page.goto('http://localhost:3000/register?next=%2Fuser%2Fme')

    const registerPanel = page
      .locator('div[aria-hidden="false"]')
      .filter({ has: page.locator('form') })
      .first()

    await registerPanel.locator('input[autocomplete="nickname"]').fill(newUser.displayName)
    await registerPanel.locator('input[type="email"]').fill(newUser.email)
    await registerPanel.locator('input[autocomplete="new-password"]').nth(0).fill(newUser.password)
    await registerPanel.locator('input[autocomplete="new-password"]').nth(1).fill(newUser.password)
    await registerPanel.locator('form button[type="submit"]').click()

    await expect(page).toHaveURL('http://localhost:3000/user/me')
    await expect(page.getByText(newUser.displayName)).toBeVisible()

    await deleteFrontendUserByEmail(newUser.email)
  })

  test('redirects authenticated users away from the login page', async ({ page }) => {
    await page.goto('http://localhost:3000/login')

    const loginPanel = page.locator('div[aria-hidden="false"]').filter({ has: page.locator('form') }).first()

    await loginPanel.locator('input[type="email"]').fill(testFrontendUser.email)
    await loginPanel.locator('input[type="password"]').fill(testFrontendUser.password)
    await loginPanel.locator('form button[type="submit"]').click()

    await expect(page).toHaveURL('http://localhost:3000/user/me')

    await page.goto('http://localhost:3000/login')

    await expect(page).toHaveURL('http://localhost:3000/user/me')
    await expect(page.getByTestId('write-article-button')).toBeVisible()
  })
})
