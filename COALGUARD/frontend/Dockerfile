FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Serve stage using lightweight preview or static web server
EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
