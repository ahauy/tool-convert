import { ApiUrl } from "@/consts/apiUrl";
import httpService from "@/services/httpService";

interface Payload {
  username: string;
  password: string;
}

export const authService = {
  login: async (payload: Payload): Promise<string> => {
    const res = await httpService.axios.post<{
      message: string;
      accessToken: string;
    }>(ApiUrl.LOGIN, payload);

    // console.log(res)
    const accessToken: string = res.data.accessToken;
    // console.log(accessToken)

    return accessToken
  },

  logout: async () => {
    await httpService.axios.post(ApiUrl.LOG_OUT)
  }
};
