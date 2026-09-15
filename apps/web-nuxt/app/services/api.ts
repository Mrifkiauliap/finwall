import axios from "axios";

export function createApi(baseURL: string) {
  const api = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
    },
  });

  let isRefreshing = false;
  let failedRequestsQueue: ((success: boolean) => void)[] = [];

  api.interceptors.response.use(
    (response) => {
      if (response.data && response.data.data !== undefined) {
        (response as any).message = response.data.message;
        response.data = response.data.data;
      }

      return response;
    },

    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (
          originalRequest.url?.includes("/auth/signin") ||
          originalRequest.url?.includes("/auth/signup") ||
          originalRequest.url?.includes("/auth/refresh")
        ) {
          return Promise.reject(error);
        }

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedRequestsQueue.push((success) => {
              if (success) {
                resolve(api(originalRequest));
              } else {
                reject(error);
              }
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          await api.post("/auth/refresh");

          failedRequestsQueue.forEach((cb) => cb(true));
          failedRequestsQueue = [];

          return api(originalRequest);
        } catch (refreshError) {
          failedRequestsQueue.forEach((cb) => cb(false));
          failedRequestsQueue = [];

          if (import.meta.client) {
            await navigateTo("/signin");
          }

          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    },
  );

  return api;
}
