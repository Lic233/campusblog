import { beforeEach, describe, expect, it, vi } from 'vitest'

const getPayloadMock = vi.fn()
const payloadAuthMock = vi.fn()

vi.mock('server-only', () => ({}))

vi.mock('payload', () => ({
  getPayload: getPayloadMock,
}))

vi.mock('@/payload.config', () => ({
  default: Promise.resolve({ fake: 'config' }),
}))

describe('frontendSession payload reuse', () => {
  beforeEach(() => {
    getPayloadMock.mockReset()
    payloadAuthMock.mockReset()

    getPayloadMock.mockResolvedValue({
      auth: payloadAuthMock,
    })
    payloadAuthMock.mockResolvedValue({ user: null })
  })

  it('reuses the same payload instance across repeated frontend auth lookups', async () => {
    vi.resetModules()

    const { getCurrentFrontendUser } = await import('@/lib/frontendSession')
    const headers = new Headers()

    await getCurrentFrontendUser(headers)
    await getCurrentFrontendUser(headers)

    expect(getPayloadMock).toHaveBeenCalledTimes(1)
    expect(payloadAuthMock).toHaveBeenCalledTimes(2)
  })
})
