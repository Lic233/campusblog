import { getPayload } from 'payload'

import config from '../../src/payload.config.js'

export const testFrontendUser = {
  email: 'frontend-user@campusblog.test',
  password: 'test-password',
  displayName: 'Frontend Test User',
}

export async function deleteFrontendUserByEmail(email: string) {
  const payload = await getPayload({ config })

  await payload.delete({
    collection: 'users',
    where: {
      email: {
        equals: email,
      },
    },
  })
}

export async function seedFrontendUser(): Promise<void> {
  const payload = await getPayload({ config })

  await deleteFrontendUserByEmail(testFrontendUser.email)

  await payload.create({
    collection: 'users',
    data: {
      ...testFrontendUser,
      isActive: true,
      roles: ['user'],
    },
  })
}

export async function cleanupFrontendUser(): Promise<void> {
  await deleteFrontendUserByEmail(testFrontendUser.email)
}
