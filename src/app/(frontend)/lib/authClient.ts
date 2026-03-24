type PayloadErrorShape = {
  error?: string
  message?: string
  errors?: Array<{
    message?: string
  }>
}

export function extractApiError(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback

  const typedPayload = payload as PayloadErrorShape

  if (typeof typedPayload.error === 'string' && typedPayload.error.trim()) {
    return typedPayload.error
  }

  if (typeof typedPayload.message === 'string' && typedPayload.message.trim()) {
    return typedPayload.message
  }

  const firstError = typedPayload.errors?.find((item) => typeof item.message === 'string')
  if (firstError?.message) return firstError.message

  return fallback
}
