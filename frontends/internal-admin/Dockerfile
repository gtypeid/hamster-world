FROM node:20 AS build
ARG BUILD_ENV=production
WORKDIR /app/internal-admin

# internal-admin 의존성 설치
COPY internal-admin/package*.json ./
RUN npm install

# common 소스 복사 (shared 모듈 - ../common = /app/common)
COPY common/ /app/common/

# common이 앱의 node_modules를 참조할 수 있도록 심볼릭 링크
RUN ln -s /app/internal-admin/node_modules /app/common/node_modules

# internal-admin 소스 복사
COPY internal-admin/ ./

# BUILD_ENV에 따라 .env 파일 선택 (aws → .env.aws를 .env.production으로 복사)
RUN if [ "$BUILD_ENV" = "aws" ] && [ -f .env.aws ]; then cp .env.aws .env.production; fi

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/internal-admin/dist /usr/share/nginx/html
