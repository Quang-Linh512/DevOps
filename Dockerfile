# Build stage
FROM node:22-alpine AS build

WORKDIR /app

# Biến môi trường build cho frontend.
# - VITE_API_URL: đường dẫn API tương đối, Nginx (nginx.conf) proxy /api -> backend:5000
# - VITE_USE_REMOTE_API: 'true' để frontend gọi API thật thay vì dữ liệu localStorage mock.
#   Đây là biến build-time, được Vite nội tuyến vào bundle -> phải truyền qua build-args
#   của CI (file .env cục bộ bị .dockerignore loại nên không thể dựa vào nó).
ARG VITE_API_URL=/api
ARG VITE_USE_REMOTE_API=true
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_USE_REMOTE_API=$VITE_USE_REMOTE_API

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage - serve static files with Nginx
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
