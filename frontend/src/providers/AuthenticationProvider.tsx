import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import httpService from "@/services/httpService";
import { toast } from "react-toastify";
import BaseUrl from "@/consts/baseUrl";
import { authService } from "@/pages/AuthPage/services/auth.service";

interface AuthenticationContextI {
  loading: boolean;
  isLogged: boolean;
  login: ({
    username,
    password,
  }: {
    username: string;
    password: string;
  }) => void;
  logout: () => void;
}

const AuthenticationContext = createContext<AuthenticationContextI>({
  loading: false,
  isLogged: false,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthenticationContext);

const AuthenticationProvider = ({ children }: { children: any }) => {
  //! State
  const [token, setToken] = useState(httpService.getTokenStorage());
  const [isLogging, setIsLogging] = useState(false);

  //! Function
  const login = useCallback(
    async ({ username, password }: { username: string; password: string }) => {
      try {
        setIsLogging(true);
        const accessToken = await authService.login({ username, password });

        if (accessToken) {
          setToken(accessToken);
          httpService.saveTokenStorage(accessToken)
          window.location.href = BaseUrl.Homepage;
        } else {
          toast("Tên đăng nhập hoặc mật khẩu bị sai!", { type: "error" });
        }
      } catch (error) {
        console.log(error);
      } finally {
        setIsLogging(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    httpService.clearStorage();
    window.sessionStorage.clear();
    window.location.reload();
  }, []);

  //! Return
  const value = useMemo(() => {
    return {
      loading: isLogging,
      isLogged: !!token,
      logout,
      login,
    };
  }, [login, logout, token, isLogging]);

  return (
    <AuthenticationContext.Provider value={value}>
      {children}
    </AuthenticationContext.Provider>
  );
};

export default AuthenticationProvider;
