FROM node:22

WORKDIR /app

COPY backend/textbot/package*.json ./textbot/
COPY miniapp/package*.json ./miniapp/

RUN cd textbot && npm install
RUN cd ../miniapp && npm install

COPY backend/textbot ./textbot
COPY miniapp ./miniapp

RUN npm install -g concurrently

EXPOSE 3000 5000

CMD ["concurrently", "--kill-others", "\"cd textbot && node main.js\"", "\"cd miniapp && npm start\""]
