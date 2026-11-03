# Base image
FROM node:20-alpine
WORKDIR /app

# Install dependencies with legacy peer deps to avoid conflicts
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy application source code
COPY . .

# Build the production assets
RUN npm run build

# Expose server port
EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

# Start command
CMD ["npm", "run", "dev"]
