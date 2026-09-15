# DevShop - Website bán hàng React cho môn DevOps

## Giới thiệu

**DevShop** là website thương mại điện tử frontend được xây dựng bằng React + Vite.
Dự án phục vụ môn học DevOps năm 4: có Docker, GitLab CI/CD và cấu trúc dễ mở rộng để kết nối backend sau này.

Hiện tại dùng **mock data / localStorage** nên chạy được ngay mà không cần backend.

## Công nghệ sử dụng

- React (JavaScript/JSX)
- Vite
- React Router DOM
- Axios
- Context API (Auth + Cart)
- CSS hiện đại (custom design system)
- Docker + Nginx
- GitLab CI/CD
- Vitest (test cơ bản)

## Tính năng

- Trang chủ: Banner, danh mục, sản phẩm nổi bật / mới, lợi ích, footer
- Đăng ký / Đăng nhập / Đăng xuất (mock auth + localStorage)
- Danh sách sản phẩm: tìm kiếm, lọc danh mục, sắp xếp, load more
- Chi tiết sản phẩm, sản phẩm liên quan
- Giỏ hàng: thêm / tăng giảm / xóa, lưu localStorage
- Thanh toán (COD / chuyển khoản), lịch sử đơn hàng
- Trang profile, Protected Route, trang 404
- Toast thông báo khi thêm/xóa giỏ hàng

### Tài khoản demo

- Email: `admin@devshop.com`
- Password: `123456`
- Role: `admin`

## Cấu trúc project

```text
devops-shop/
├── src/
│   ├── assets/
│   ├── components/
│   ├── pages/
│   ├── context/
│   ├── services/
│   ├── data/
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── .gitlab-ci.yml
├── .env
└── README.md
```

## Cài đặt

```bash
npm install
```

## Chạy project

```bash
npm run dev
```

Mở trình duyệt tại địa chỉ Vite in ra (thường là http://localhost:5173).

## Build

```bash
npm run build
```

Xem bản build:

```bash
npm run preview
```

## Test

```bash
npm run test
```

## Docker

Build image:

```bash
docker build -t devops-shop .
```

Chạy container:

```bash
docker run -p 8080:80 devops-shop
```

Hoặc dùng Docker Compose:

```bash
docker compose up --build -d
```

Truy cập: http://localhost:8080

## GitLab CI/CD

File `.gitlab-ci.yml` định nghĩa 3 stage:

1. **install** — chạy `npm ci` để cài dependencies
2. **build** — chạy `npm run build` tạo thư mục `dist/`
3. **test** — chạy `npm run test` (Vitest)

Khi push code lên GitLab, pipeline sẽ chạy tự động theo thứ tự trên.

## Kết nối backend sau này

1. Sửa `VITE_API_URL` trong file `.env`
2. Bỏ comment phần gọi Axios thật trong `src/services/api.js`
3. Không cần sửa từng component vì chúng gọi qua service layer

## Đưa project lên GitLab

Trong thư mục `devops-shop`:

```bash
git init
git add .
git commit -m "Initial commit: DevShop e-commerce for DevOps course"
git branch -M main
git remote add origin https://gitlab.com/<username>/devops-shop.git
git push -u origin main
```

Sau khi push, vào GitLab → **Build → Pipelines** để xem CI/CD chạy.

Gửi cho giảng viên: link repository GitLab (ví dụ `https://gitlab.com/<username>/devops-shop`).
