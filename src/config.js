const rawApiUrl = import.meta.env.VITE_API_URL || '/api/v1'

export const API_URL = rawApiUrl.replace(/\/+$/, '')

export const API_ROOT = API_URL.endsWith('/api/v1')
  ? API_URL.slice(0, -'/api/v1'.length)
  : API_URL

export const HEALTH_URL = API_ROOT ? `${API_ROOT}/health` : '/health'

export const DOCS_URL =
  import.meta.env.VITE_DOCS_URL ||
  (API_ROOT ? `${API_ROOT}/docs` : 'http://127.0.0.1:8000/docs')

export const REQUEST_TIMEOUT = 10000
