FROM node:20 AS build
WORKDIR /app

# internal-admin 의존성 설치
COPY internal-admin/package*.json ./
RUN npm install

# common 소스 복사 (shared 모듈)
COPY common/ ../common/

# internal-admin 소스 복사
COPY internal-admin/ ./

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
