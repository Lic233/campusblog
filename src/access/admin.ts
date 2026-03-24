import type { Access } from 'payload'

type RoleAwareUser = {
  id?: number | string | null
  roles?: string[] | null
} | null

export const hasAdminRole = (user: RoleAwareUser): boolean => {
  return Boolean(user?.roles?.includes('admin'))
}

export const authenticated: Access = ({ req: { user } }) => {
  return Boolean(user)
}

export const adminOnly: Access = ({ req: { user } }) => {
  return hasAdminRole(user)
}

export const adminOrSelf: Access = ({ req: { user } }) => {
  if (hasAdminRole(user)) return true
  if (!user?.id) return false

  return {
    id: {
      equals: user.id,
    },
  }
}

export const adminOrAuthor: Access = ({ req: { user } }) => {
  if (hasAdminRole(user)) return true
  if (!user?.id) return false

  return {
    author: {
      equals: user.id,
    },
  }
}

export const adminOrPublishedOrAuthor: Access = ({ req: { user } }) => {
  if (hasAdminRole(user)) return true
  if (!user?.id) {
    return {
      status: {
        equals: 'published',
      },
    }
  }

  return {
    or: [
      {
        status: {
          equals: 'published',
        },
      },
      {
        author: {
          equals: user.id,
        },
      },
    ],
  }
}

export const adminOrActive: Access = ({ req: { user } }) => {
  if (hasAdminRole(user)) return true

  return {
    isActive: {
      equals: true,
    },
  }
}

export const adminOrPublished: Access = ({ req: { user } }) => {
  if (hasAdminRole(user)) return true

  return {
    status: {
      equals: 'published',
    },
  }
}
