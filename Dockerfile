FROM node:20.13.1-slim

RUN apt-get update && apt-get install -y python3 build-essential

WORKDIR /app

# Add node executables to path
ENV PATH /app/node_modules/.bin:$PATH

# install app dependencies
COPY package.json ./
COPY package-lock.json ./
RUN npm install
