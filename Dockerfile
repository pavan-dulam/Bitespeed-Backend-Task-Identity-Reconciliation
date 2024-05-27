FROM node:18.16-alpine

WORKDIR /app

COPY package.json /app

# Install dependencies without executing scripts
RUN npm install --ignore-scripts

COPY . /app

EXPOSE 3000

ENTRYPOINT [ "node" ]

CMD [ "index.js" ]