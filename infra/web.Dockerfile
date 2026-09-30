FROM node:24-alpine AS build
WORKDIR /workspace

ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=${VITE_API_URL}

COPY package.json ./
COPY tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm install

COPY apps/web apps/web
COPY packages/shared packages/shared

RUN npm run build --workspace @sos-procuresphere/shared
RUN npm run build --workspace @sos-procuresphere/web

FROM nginx:1.27-alpine
COPY infra/web.nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/apps/web/dist /usr/share/nginx/html

EXPOSE 8080
