FROM node:22-alpine AS Builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

FROM node:22-alpine
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

COPY package*.json ./

ENV NODE_ENV=production

EXPOSE 8080

CMD [ "npm","run","start:prod" ]