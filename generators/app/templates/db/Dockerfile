FROM node:16-slim
WORKDIR /db
COPY db .
RUN npm install --only=production --target_platform=linux --target_libc=glibc --target_arch=x64 
RUN apt-get update
RUN apt-get install -y openssl python make g++
ENV NODE_ENV=production
USER node
CMD [ "npm", "start" ]