/**
 * Giữ chuỗi Base64 lớn ngoài React state/props để:
 *  - không bị render lại / so sánh / copy mỗi lần state đổi
 *  - không làm nặng React DevTools khi inspect component
 */
let held = "";

export const base64Store = {
  set: (value: string) => {
    held = value;
  },
  take: (): string => {
    const value = held;
    held = "";
    return value;
  },
};
