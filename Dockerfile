# Use a Node.js base image
FROM node:18-bullseye

# Install compilers and dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    default-jdk \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Create temp directories and ensure they are writable
RUN mkdir -p /tmp/compilex_temp saved_codes shared_codes frontend_projects frontend_assets \
    && chmod -R 777 /tmp/compilex_temp saved_codes shared_codes frontend_projects frontend_assets

# Expose the port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Use /tmp for compiler temp files as it's writable in Render
ENV COMPILEX_TEMP=/tmp/compilex_temp

# Start the application
CMD ["node", "Api.js"]
