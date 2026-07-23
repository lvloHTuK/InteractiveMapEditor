## Build the client (React + Vite) into static assets
FROM node:24-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

## Compile the server (Express + TypeScript) to plain JS
FROM node:24-alpine AS server-build
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

## Runtime image: only production deps + compiled output
FROM node:24-alpine
WORKDIR /app/server
ENV NODE_ENV=production
ENV PORT=4000
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=server-build /app/server/dist ./dist
COPY --from=client-build /app/client/dist ../client/dist

EXPOSE 4000
CMD ["node", "dist/index.js"]
