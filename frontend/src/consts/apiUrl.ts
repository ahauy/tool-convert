const ROOT_URL = `${import.meta.env.VITE_URL_BACKEND}/api`;

export const ApiUrl = {
  // auth 
  REGISTER: `${ROOT_URL}/auth/register`,
  LOGIN: `${ROOT_URL}/auth/login`,

  // tools
  IMAGE_TO_BASE64: `${ROOT_URL}/tools/image-to-base64`,
  VIDEO_TO_BASE64: `${ROOT_URL}/tools/video-to-base64`,
}