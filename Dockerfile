FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm test && npm run rank && npm run build

ENV NODE_ENV=production
ENV PORT=4173

EXPOSE 4173

CMD ["npm", "start"]
