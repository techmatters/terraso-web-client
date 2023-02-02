FROM node:18.13-slim

WORKDIR /app

# Add node executables to path
ENV PATH /app/node_modules/.bin:$PATH

# install app dependencies
COPY package.json ./
COPY package-lock.json ./
RUN npm install
