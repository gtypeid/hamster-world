FROM node:20 AS build
WORKDIR /app

# hamster-controller 의존성 설치
COPY hamster-controller/package*.json ./
RUN npm install

# common 소스 복사 (shared 모듈)
COPY common/ ../common/

# hamster-controller 소스 복사
COPY hamster-controller/ ./

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
