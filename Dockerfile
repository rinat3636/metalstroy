FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run migrate && npm run build

ENV HOST=0.0.0.0
ENV PORT=8080
ENV NODE_ENV=production
EXPOSE 8080

CMD ["npm", "start"]
