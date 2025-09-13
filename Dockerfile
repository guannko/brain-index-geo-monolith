FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source
COPY . .

# Try to build
RUN npm run build

# Start
EXPOSE 3000
CMD ["npm", "start"]
