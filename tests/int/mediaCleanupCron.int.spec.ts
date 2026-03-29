import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const {
  cleanupAllOrphanMediaMock,
  createPayloadConfigMock,
  getPayloadMock,
} = vi.hoisted(() => ({
  cleanupAllOrphanMediaMock: vi.fn(),
  createPayloadConfigMock: vi.fn(),
  getPayloadMock: vi.fn(),
}))

vi.mock('payload', () => ({
  getPayload: getPayloadMock,
}))

vi.mock('@/payload/createPayloadConfig', () => ({
  createPayloadConfig: createPayloadConfigMock,
}))

vi.mock('@/media/orphanCleanup', () => ({
  cleanupAllOrphanMedia: cleanupAllOrphanMediaMock,
}))

describe('media cleanup cron', () => {
  const cloudflareContextSymbol = Symbol.for('__cloudflare-context__')
  const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, cloudflareContextSymbol)

  beforeEach(() => {
    vi.resetModules()
    createPayloadConfigMock.mockReset()
    getPayloadMock.mockReset()
    cleanupAllOrphanMediaMock.mockReset()

    Object.defineProperty(globalThis, cloudflareContextSymbol, {
      configurable: true,
      get() {
        return undefined
      },
    })
  })

  afterEach(() => {
    if (originalDescriptor) {
      Object.defineProperty(globalThis, cloudflareContextSymbol, originalDescriptor)
      return
    }

    Reflect.deleteProperty(globalThis, cloudflareContextSymbol)
  })

  it('runs orphan cleanup using explicit worker bindings when cloudflare context is getter-only', async () => {
    const env = {
      D1: { binding: 'd1' },
      R2: { binding: 'r2' },
    }
    const payloadConfig = { config: true }
    const payload = { payload: true }
    const cleanupResult = {
      deletedIds: [42],
      referencedCount: 3,
      scannedCount: 5,
    }

    createPayloadConfigMock.mockReturnValue(payloadConfig)
    getPayloadMock.mockResolvedValue(payload)
    cleanupAllOrphanMediaMock.mockResolvedValue(cleanupResult)

    const { runMediaCleanupCron } = await import('@/worker/mediaCleanupCron')

    await expect(runMediaCleanupCron(env as never)).resolves.toEqual(cleanupResult)
    expect(createPayloadConfigMock).toHaveBeenCalledWith(env)
    expect(getPayloadMock).toHaveBeenCalledWith({ config: payloadConfig })
    expect(cleanupAllOrphanMediaMock).toHaveBeenCalledWith({ payload })
  })
})
