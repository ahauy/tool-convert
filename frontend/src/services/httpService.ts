import { ApiUrl } from "@/consts/apiUrl";
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";

export const TOKEN_KEY = "token";

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

class Services {
  axios: AxiosInstance;

  // Dùng chung 1 lần refresh cho nhiều request cùng bị 401
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.axios = axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      withCredentials: true,
    });

    this.setupRequestInterceptor();
    this.setupResponseInterceptor();
  }

  private setupRequestInterceptor() {
    this.axios.interceptors.request.use(
      (config) => {
        const token = this.getTokenStorage();

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  /**
   * Gọi refresh bằng axios "trần" (KHÔNG dùng this.axios) để request này
   * không đi qua interceptor. Nếu đi qua, khi refresh trả 401 thì interceptor
   * lại gọi refresh tiếp -> lặp vô hạn (chính là lỗi bạn gặp).
   */
  private refreshAccessToken(): Promise<string> {
    if (!this.refreshPromise) {
      this.refreshPromise = axios
        .post(ApiUrl.REFRESH_TOKEN, null, { withCredentials: true })
        .then((res) => {
          const newAccessToken: string = res.data.accessToken;
          this.saveTokenStorage(newAccessToken);
          return newAccessToken;
        })
        .finally(() => {
          this.refreshPromise = null;
        });
    }
    return this.refreshPromise;
  }

  private isAuthUrl(url?: string) {
    return (
      !!url &&
      [ApiUrl.LOGIN, ApiUrl.REGISTER, ApiUrl.REFRESH_TOKEN].some((u) =>
        url.includes(u)
      )
    );
  }

  private setupResponseInterceptor() {
    this.axios.interceptors.response.use(
      (response) => response,

      async (error: AxiosError) => {
        const originalRequest = error.config as RetryableConfig | undefined;

        const shouldRefresh =
          error.response?.status === 401 &&
          !!originalRequest &&
          !originalRequest._retry && // mỗi request chỉ được thử lại 1 lần
          !this.isAuthUrl(originalRequest.url); // login / refresh không refresh

        if (!shouldRefresh) {
          return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
          const newAccessToken = await this.refreshAccessToken();
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return this.axios(originalRequest);
        } catch (refreshError) {
          // Refresh thất bại (hết hạn / bị thu hồi / thiếu cookie) -> đăng xuất
          this.clearStorage();
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      }
    );
  }

  get(url: string, config?: AxiosRequestConfig) {
    return this.axios.get(url, config);
  }

  post(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.axios.post(url, data, config);
  }

  delete(url: string, config?: AxiosRequestConfig) {
    return this.axios.delete(url, config);
  }

  put(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.axios.put(url, data, config);
  }

  saveTokenStorage(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  getTokenStorage() {
    return localStorage.getItem(TOKEN_KEY);
  }

  clearStorage() {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export default new Services();