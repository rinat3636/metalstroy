FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run migrate && npm run build \
  && mkdir -p /app/.seed/catalog-data \
  && cp -a src/data/. /app/.seed/catalog-data/

RUN chmod +x /app/scripts/docker-entrypoint.sh

ENV HOST=0.0.0.0
ENV PORT=8080
ENV NODE_ENV=production
EXPOSE 8080

ENTRYPOINT ["/app/scripts/docker-entrypoint.sh"]
CMD ["npm", "start"]
