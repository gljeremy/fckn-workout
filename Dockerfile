# Build the static site, then serve it from nginx under /fckn-workout/.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG APP_BASE_PATH=/fckn-workout/
ENV APP_BASE_PATH=$APP_BASE_PATH
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html/fckn-workout
EXPOSE 80
