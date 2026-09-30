FROM node:24-alpine AS build
WORKDIR /workspace

COPY package.json ./
COPY tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm install

COPY apps/api apps/api
COPY packages/shared packages/shared

RUN npm run build --workspace @sos-procuresphere/shared
RUN npm run build --workspace @sos-procuresphere/api

FROM node:24-alpine
WORKDIR /app

COPY --from=build /workspace/node_modules ./node_modules
COPY --from=build /workspace/packages/shared/package.json ./node_modules/@sos-procuresphere/shared/package.json
COPY --from=build /workspace/packages/shared/dist ./node_modules/@sos-procuresphere/shared/dist
COPY --from=build /workspace/apps/api/dist ./apps/api/dist
COPY --from=build /workspace/apps/api/storage ./apps/api/storage

EXPOSE 4000
WORKDIR /app/apps/api

CMD ["node", "dist/main.js"]
