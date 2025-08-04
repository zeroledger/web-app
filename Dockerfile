FROM node:lts-alpine AS base
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk update && apk add --no-cache libc6-compat
WORKDIR /app

# Rebuild the source code only when needed
FROM base AS deps
RUN apk add --no-cache make && apk add --no-cache bash
COPY ./package.json ./package.json
COPY ./package-lock.json ./package-lock.json

RUN npm install

FROM deps AS build
COPY ./src ./src
COPY ./public ./public 
COPY ./vite.config.ts ./tsconfig.json ./tsconfig.node.json ./postcss.config.cjs ./index.html ./
ENV NODE_ENV=production
RUN npm run build

# Production Stage
FROM nginx:stable-alpine
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]