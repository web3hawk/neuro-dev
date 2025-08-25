# Frontend Dockerfile for neuro-dev React application - Development Mode
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy root package.json (contains all dependencies)
COPY package*.json ./

# Copy frontend application
COPY apps/frontend/ ./apps/frontend/

# Install all dependencies
RUN npm install

# Expose React development server port
EXPOSE 3001

# Health check for development server
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001 || exit 1

# Start the React development server
CMD ["npm", "run", "frontend:start"]
