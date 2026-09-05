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
