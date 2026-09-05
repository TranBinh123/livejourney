'use client';

// Mật khẩu vào khu vực Admin. Mặc định "khatvongtuoi20".
// Có thể đổi khi deploy bằng biến môi trường NEXT_PUBLIC_ADMIN_PASSWORD
// (ví dụ đổi mật khẩu cho từng mùa sự kiện) mà không cần sửa code.
export const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'khatvongtuoi20';

const KEY = 'banacode-admin-authed';

// Lưu trạng thái đăng nhập theo phiên trình duyệt (sessionStorage):
// còn hiệu lực khi qua lại giữa "/" và "/admin" trong cùng tab,
// nhưng sẽ hỏi lại mật khẩu nếu đóng hẳn trình duyệt / mở tab mới.
export function isAdminAuthed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function setAdminAuthed(): void {
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {}
}

export function clearAdminAuthed(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
}
