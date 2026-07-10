FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=https://aqualog.home.cylindric.net
ARG VITE_OIDC_AUTHORITY=https://auth.aqualog.home.cylindric.net/application/o/aqualog-spa/
ARG VITE_OIDC_CLIENT_ID=frontend-dockerfile-replace-with-aqualog-spa-client-id
ARG VITE_OIDC_REDIRECT_URI=https://aqualog.home.cylindric.net/auth/callback
ARG VITE_OIDC_POST_LOGOUT_REDIRECT_URI=https://aqualog.home.cylindric.net
ARG VITE_OIDC_SCOPE=openid profile email offline_access

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_OIDC_AUTHORITY=${VITE_OIDC_AUTHORITY}
ENV VITE_OIDC_CLIENT_ID=${VITE_OIDC_CLIENT_ID}
ENV VITE_OIDC_REDIRECT_URI=${VITE_OIDC_REDIRECT_URI}
ENV VITE_OIDC_POST_LOGOUT_REDIRECT_URI=${VITE_OIDC_POST_LOGOUT_REDIRECT_URI}
ENV VITE_OIDC_SCOPE=${VITE_OIDC_SCOPE}

RUN npm run build

FROM nginx:1.29-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
