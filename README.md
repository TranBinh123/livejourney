# THE BANACODE – LIVE JOURNEY TRACKING MVP

## Chạy local
```bash
npm install
npm run dev
```
- Public: http://localhost:3000
- Admin: http://localhost:3000/admin

MVP dùng `localStorage + BroadcastChannel` để mô phỏng realtime ngay lập tức giữa nhiều tab trình duyệt, không cần backend/credential. Đây là lựa chọn cố ý để demo vận hành nhanh.

## Logic cốt lõi
- `completedChallenges[checkpoint]` độc lập với `completedAt[checkpoint]`.
- Nút `HOÀN THÀNH ĐỊA ĐIỂM` luôn khả dụng, không validation TC1/TC2.
- Khi hoàn thành địa điểm: timestamp -> tăng checkpoint -> public marker animation/realtime.
- Finish ghi `finishedAt`.
- Điểm finish: 100/80/60/40.
- Điểm phạt -10 cần áp dụng khi tổng số challenge hoàn thành toàn hành trình = 0; UI MVP đã lưu đủ dữ liệu để tính.

## Đưa lên Supabase
Có thể thay lớp `lib/store.ts` bằng Supabase Realtime mà không cần thay UI/data model. Schema tối thiểu nên gồm `teams`, `checkpoints`, `team_checkpoint_status` và broadcast/presence.

## Cập nhật gần nhất
- **Admin trên mobile**: bảng dữ liệu chuyển sang dạng thẻ xếp dọc trên màn hình nhỏ (`md:hidden`), không còn phải kéo ngang; từ `md` trở lên vẫn hiển thị dạng bảng như cũ.
- **Mật khẩu Admin**: `/admin` yêu cầu mật khẩu, mặc định `khatvongtuoi20` (khai báo ở `lib/auth.ts`). Có thể đổi khi deploy bằng biến môi trường `NEXT_PUBLIC_ADMIN_PASSWORD` mà không cần sửa code. Đây là lớp bảo vệ phía client (phù hợp với mô hình demo không backend), không thay thế cho việc xác thực phía server nếu triển khai chính thức. Trạng thái đăng nhập lưu theo phiên trình duyệt (`sessionStorage`).
- **10 địa điểm**: `lib/data.ts` hiện có 10 checkpoint — Xuất phát `CỔNG THỜI GIAN`, `CHECK POINT 2`…`CHECK POINT 9`, và `ĐÍCH ĐẾN`. Toàn bộ logic (Timeline, ranking, tổng hợp điểm...) đọc số lượng checkpoint động từ mảng này nên không cần sửa gì thêm nếu muốn đổi tên/số lượng sau này.
- **Nút "📊 Tổng hợp điểm"** (trong Admin): tính điểm chung cuộc cho cả 4 đội dựa trên dữ liệu hiện có — điểm về đích theo thứ tự (100/80/60/40) + phạt −10 nếu đội không hoàn thành thử thách nào trong suốt hành trình (logic ở `lib/scoring.ts`, đúng theo phần "Logic cốt lõi" phía trên). Kết quả hiện trong một bảng tổng hợp ngay tại Admin, không tự động ghi lên màn hình public.
