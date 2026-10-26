# 1. Build the React app with Vite
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./

# dev dependencies are needed: vite builds the app
RUN npm ci

COPY . .

# the browser calls the API directly, so this is the URL seen from your computer
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# 2. Serve the built files with nginx
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
