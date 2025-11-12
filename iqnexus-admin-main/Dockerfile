# Admin Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Expose port
EXPOSE 3000

# Set environment variable for Vite
ENV HOST=0.0.0.0

# Start the application with proper host binding
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
