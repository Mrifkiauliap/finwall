import { API_BASE_URL } from '@/lib/env'
import { navigate } from '@/lib/navigation'
import axios, { AxiosError, type AxiosInstance } from 'axios'

/**
 * Klien HTTP Finwall.
 *
 * Autentikasi memakai httpOnly cookie, jadi `withCredentials: true` wajib dan
 * JavaScript tidak pernah melihat tokennya.
 *
 * Alur 401: request yang gagal karena access token kedaluwarsa akan ditahan,
 * satu request `/auth/refresh` dijalankan (rotasi refresh token), lalu semua
 * request yang tertahan diulang. Bila refresh gagal, user diarahkan ke /signin.
 */
export function createApi(baseURL: string = API_BASE_URL): AxiosInstance {
  const api = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  /** Request yang menunggu hasil refresh. */
  let isRefreshing = false
  let failedRequestsQueue: ((success: boolean) => void)[] = []

  const AUTH_ROUTES = ['/auth/signin', '/auth/signup', '/auth/refresh']

  api.interceptors.response.use(
    (response) => {
      // Backend membungkus payload: { message, error, data }. Ratakan agar
      // pemanggil cukup memakai `res.data`.
      if (response.data && response.data.data !== undefined) {
        ;(response as unknown as { message?: string }).message = response.data.message
        response.data = response.data.data
      }

      return response
    },

    async (error: AxiosError) => {
      const originalRequest = error.config as
        (NonNullable<AxiosError['config']> & { _retry?: boolean }) | undefined

      if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
        // Endpoint auth sendiri tidak boleh memicu refresh (menghindari loop).
        if (AUTH_ROUTES.some((path) => originalRequest.url?.includes(path))) {
          return Promise.reject(error)
        }

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedRequestsQueue.push((success) => {
              if (success) {
                resolve(api(originalRequest))
              } else {
                reject(error)
              }
            })
          })
        }

        originalRequest._retry = true
        isRefreshing = true

        try {
          await api.post('/auth/refresh')

          failedRequestsQueue.forEach((cb) => cb(true))
          failedRequestsQueue = []

          return api(originalRequest)
        } catch (refreshError) {
          failedRequestsQueue.forEach((cb) => cb(false))
          failedRequestsQueue = []

          navigate('/signin')

          return Promise.reject(refreshError)
        } finally {
          isRefreshing = false
        }
      }

      return Promise.reject(error)
    },
  )

  return api
}

/** Instance tunggal yang dipakai seluruh aplikasi. */
export const api = createApi()
