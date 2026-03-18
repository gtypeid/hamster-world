FROM node:20 AS build
ARG BUILD_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# BUILD_ENV에 따라 .env 파일 선택 (aws → .env.aws를 .env.production으로 복사)
RUN if [ "$BUILD_ENV" = "aws" ] && [ -f .env.aws ]; then cp .env.aws .env.production; fi
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
