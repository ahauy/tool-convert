// import { UserInfo } from "@/interfaces/user";
// import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

import { ApiUrl } from "@/consts/apiUrl";
import axios, { Axios, AxiosError, AxiosInstance, AxiosRequestConfig } from "axios"

// export const TOKEN_KEY = "token";
// export const USER_KEY = "user";

// class Services {
//   axios: AxiosInstance;

//   constructor() {
//     this.axios = axios;
//     this.axios.defaults.withCredentials = true;

//     //! Interceptor request
//     this.axios.interceptors.request.use(
//       function (config) {
//         return config;
//       },
//       function (error) {
//         return Promise.reject(error);
//       }
//     );

//     this.axios.interceptors.request.use((config) => {
//       const token = this.getTokenStorage();

//       if (token) {
//         config.headers.Authorization = `Bearer ${token}`;
//       }

//       return config;
//     });

//     //! Interceptor response
//     this.axios.interceptors.response.use(
//       function (config) {
//         return config;
//       },
//       function (error) {
//         return Promise.reject(error);
//       }
//     );
//   }

//   attachTokenToHeader(token: string) {
//     this.axios.interceptors.request.use(
//       function (config) {
//         if (config.headers) {
//           // Do something before request is sent
//           config.headers.Authorization = `Bearer ${token}`;
//         }
//         return config;
//       },
//       function (error) {
//         return Promise.reject(error);
//       }
//     );
//   }

//   setupInterceptors() {
//     this.axios.interceptors.response.use(
//       (response) => {
//         return response;
//       },
//       (error) => {
//         const { status } = error?.response || {};
//         if (status === 401) {
//           window.localStorage.clear();
//           window.location.reload();
//         }

//         return Promise.reject(error);
//       }
//     );
//   }

//   get(url: string, config?: AxiosRequestConfig) {
//     return this.axios.get(url, config);
//   }

//   post(url: string, data: any, config?: AxiosRequestConfig) {
//     return this.axios.post(url, data, config);
//   }

//   delete(url: string, config?: AxiosRequestConfig) {
//     return this.axios.delete(url, config);
//   }

//   put(url: string, data: any, config?: AxiosRequestConfig) {
//     return this.axios.put(url, data, config);
//   }

//   saveTokenStorage(token: string) {
//     localStorage.setItem(TOKEN_KEY, token);
//   }

//   getTokenStorage() {
//     const token = localStorage.getItem(TOKEN_KEY);
//     return token || "";
//   }

//   clearStorage() {
//     localStorage.removeItem(TOKEN_KEY);
//     localStorage.removeItem(USER_KEY);
//   }

//   saveUserStorage(user: UserInfo) {
//     localStorage.setItem(USER_KEY, JSON.stringify(user));
//   }

//   getUserStorage() {
//     if (localStorage.getItem(USER_KEY)) {
//       return JSON.parse(localStorage?.getItem(USER_KEY) || "") as UserInfo;
//     }

//     return null;
//   }
// }

// export default new Services();


export const TOKEN_KEY = "token"
class Services {
  axios: AxiosInstance;

  private isRefreshing = false;

  constructor() {
    this.axios = axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      withCredentials: true,
    })

    this.setupRequestInterceptor()
    this.setupResponseInterceptor()

  }

  private setupRequestInterceptor() {
    this.axios.interceptors.request.use(
      (config) => {
        const token = this.getTokenStorage()

        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        return config;
      },
      (error) => Promise.reject(error)
    )
  }

  private setupResponseInterceptor() {
    this.axios.interceptors.response.use(
      (response) => response,

      async (error: AxiosError) => {
        const originalRequest = error.config;

        if (
          error.response?.status === 401 &&
          originalRequest
        ) {
          try {
            const res = await this.axios.post(`${ApiUrl.REFRESH_TOKEN}`)
            const newAccessToken = res.data.accessToken;

            this.saveTokenStorage(newAccessToken);

            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`

            return this.axios(originalRequest)
          } catch (error) {
            this.clearStorage();
            window.location.reload();
            return Promise.reject(error);
          }
        }
        return Promise.reject(error)
      }
    )

  }

  get(url: string, config?: AxiosRequestConfig) {
    return this.axios.get(url, config)
  }

  post(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.axios.post(url, data, config)
  }

  delete(url: string, config?: AxiosRequestConfig) {
    return this.axios.delete(url, config)
  }

  put(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.axios.put(url, data, config)
  }

  saveTokenStorage(token: string) {
    localStorage.setItem(TOKEN_KEY, token)
  }

  getTokenStorage() {
    return localStorage.getItem(TOKEN_KEY)
  }

  clearStorage() {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export default new Services()