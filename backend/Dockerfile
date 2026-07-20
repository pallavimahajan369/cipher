# ---------- Build Stage ----------
FROM node:22-alpine AS builder

WORKDIR /app

COPY backend/package*.json ./

RUN npm install

COPY backend/ ./
COPY shared/ ../shared/

RUN npm run build

# ---------- Production Stage ----------
FROM node:22-alpine

WORKDIR /app

COPY backend/package*.json ./

RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /shared /shared

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
