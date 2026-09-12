FROM node:24-alpine

WORKDIR /app

# Install build tools for native addons (bcrypt)
RUN apk add --no-cache python3 make g++

# Install dependencies
COPY package*.json tsconfig.json ./
RUN npm install && apk del python3 make g++

# Copy application code and configs
COPY app ./app
COPY domain ./domain
COPY infrastructure ./infrastructure
COPY public ./public
COPY nodemon.json ./

# Compile TypeScript
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
