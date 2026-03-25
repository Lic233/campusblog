'use client'

import { useAuth, useDocumentInfo } from '@payloadcms/ui'

function idsMatch(
  left: number | string | null | undefined,
  right: number | string | null | undefined,
) {
  if (left === null || left === undefined || right === null || right === undefined) return false
  return String(left) === String(right)
}

export default function UserPasswordChangeNotice() {
  const { user } = useAuth<{ id?: number | string | null; roles?: string[] | null }>()
  const { id } = useDocumentInfo()

  const isAdmin = Boolean(user?.roles?.includes('admin'))
  const isEditingSelf = idsMatch(user?.id, id)

  if (!isAdmin || isEditingSelf) return null

  return (
    <>
      <style>{`
        #change-password,
        .auth-fields__changing-password {
          display: none !important;
        }
      `}</style>
    </>
  )
}
