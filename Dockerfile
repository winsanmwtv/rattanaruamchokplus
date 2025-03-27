# Use a lightweight Node.js image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy dependency files and install dependencies
COPY package*.json ./
RUN npm install

# Copy your source code into the container
COPY . .

# Expose the port (default for Next.js is 3000)
EXPOSE 3000

# Start your Next.js app in development mode
CMD ["npm", "run", "dev"]
