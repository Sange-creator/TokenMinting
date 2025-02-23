# Use Node.js LTS version
FROM node:20-slim

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Set environment variables
ENV REACT_APP_API_URL=http://localhost:3000
ENV PORT=3001

# Expose port
EXPOSE 3001

# Start the development server
CMD ["npm", "start"] 