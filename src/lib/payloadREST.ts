import 'server-only'

type Primitive = boolean | number | string

type QueryValue = Primitive | null | undefined | QueryValue[] | { [key: string]: QueryValue }

type FindOptions = {
  depth?: number
  limit?: number
  page?: number
  sort?: string
  where?: Record<string, QueryValue>
}

type AuthResponse<TUser> = {
  user?: TUser | null
}

type PaginatedResponse<TDoc> = {
  docs: TDoc[]
  totalPages: number
}

type RequestOptions = {
  body?: unknown
  method?: 'DELETE' | 'GET' | 'PATCH' | 'POST'
  query?: Record<string, QueryValue>
}

export class PayloadRESTError extends Error {
  status: number
  data?: unknown

  constructor(message: string, status: number, data?: unknown) {
    super(message)
    this.name = 'PayloadRESTError'
    this.status = status
    this.data = data
  }
}

function appendQueryValue(params: URLSearchParams, key: string, value: QueryValue): void {
  if (value === undefined) return

  if (value === null) {
    params.append(key, 'null')
    return
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => appendQueryValue(params, `${key}[${index}]`, item))
    return
  }

  if (typeof value === 'object') {
    for (const [nestedKey, nestedValue] of Object.entries(value)) {
      appendQueryValue(params, `${key}[${nestedKey}]`, nestedValue)
    }
    return
  }

  params.append(key, String(value))
}

function buildQueryString(query?: Record<string, QueryValue>): string {
  if (!query) return ''

  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(query)) {
    appendQueryValue(params, key, value)
  }

  const result = params.toString()
  return result ? `?${result}` : ''
}

function buildForwardHeaders(request: Request, hasBody: boolean): Headers {
  const headers = new Headers()
  const cookie = request.headers.get('cookie')
  const authorization = request.headers.get('authorization')
  const acceptLanguage = request.headers.get('accept-language')

  if (cookie) headers.set('cookie', cookie)
  if (authorization) headers.set('authorization', authorization)
  if (acceptLanguage) headers.set('accept-language', acceptLanguage)
  if (hasBody) headers.set('content-type', 'application/json')

  return headers
}

function getErrorMessage(status: number, data: unknown): string {
  if (data && typeof data === 'object') {
    if ('message' in data && typeof data.message === 'string' && data.message.trim()) {
      return data.message
    }

    if ('error' in data && typeof data.error === 'string' && data.error.trim()) {
      return data.error
    }

    if ('errors' in data && Array.isArray(data.errors) && data.errors.length > 0) {
      const firstError = data.errors[0]
      if (firstError && typeof firstError === 'object' && 'message' in firstError) {
        const message = firstError.message
        if (typeof message === 'string' && message.trim()) {
          return message
        }
      }
    }
  }

  return `Payload request failed with status ${status}`
}

export function createPayloadRESTClient(request: Request) {
  const apiBaseURL = new URL('/api/', request.url)

  const requestJSON = async <TResponse>(
    path: string,
    { body, method = 'GET', query }: RequestOptions = {},
  ): Promise<TResponse> => {
    const response = await fetch(new URL(`${path}${buildQueryString(query)}`, apiBaseURL), {
      method,
      headers: buildForwardHeaders(request, body !== undefined),
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
    })

    const text = await response.text()
    const data = text ? (JSON.parse(text) as unknown) : undefined

    if (!response.ok) {
      throw new PayloadRESTError(getErrorMessage(response.status, data), response.status, data)
    }

    return data as TResponse
  }

  return {
    async auth<TUser>(): Promise<TUser | null> {
      try {
        const response = await requestJSON<AuthResponse<TUser>>('users/me')
        return response.user ?? null
      } catch (error) {
        if (error instanceof PayloadRESTError && error.status === 401) {
          return null
        }
        throw error
      }
    },

    create<TDoc>(collection: string, data: Record<string, unknown>): Promise<TDoc> {
      return requestJSON<TDoc>(collection, { body: data, method: 'POST' })
    },

    delete<TDoc>(collection: string, id: number | string): Promise<TDoc> {
      return requestJSON<TDoc>(`${collection}/${encodeURIComponent(String(id))}`, {
        method: 'DELETE',
      })
    },

    find<TDoc>(collection: string, options: FindOptions = {}): Promise<PaginatedResponse<TDoc>> {
      return requestJSON<PaginatedResponse<TDoc>>(collection, {
        query: options as Record<string, QueryValue>,
      })
    },

    findByID<TDoc>(
      collection: string,
      id: number | string,
      options: Pick<FindOptions, 'depth'> = {},
    ): Promise<TDoc> {
      return requestJSON<TDoc>(`${collection}/${encodeURIComponent(String(id))}`, {
        query: options as Record<string, QueryValue>,
      })
    },

    update<TDoc>(collection: string, id: number | string, data: Record<string, unknown>): Promise<TDoc> {
      return requestJSON<TDoc>(`${collection}/${encodeURIComponent(String(id))}`, {
        body: data,
        method: 'PATCH',
      })
    },
  }
}
