FROM node:22-alpine

WORKDIR /app

# Dump tools used by the backups: pg_dump (PostgreSQL 16) and mariadb-dump (MySQL)
RUN apk add --no-cache postgresql16-client mysql-client mariadb-connector-c

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
