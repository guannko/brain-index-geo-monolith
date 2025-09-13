# Single-stage build for Railway
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY .npmrc* ./

# Install dependencies
RUN npm ci || npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the app
RUN npm run build

# Expose port
EXPOSE 3000

# Start the app
CMD ["node", "dist/index.js"]
