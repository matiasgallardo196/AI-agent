# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate prisma client
RUN npx prisma generate

# Copy rest of the code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-slim AS production

WORKDIR /app



# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm ci --omit=dev

# Generate prisma client for production
RUN npx prisma generate

# Copy generated dist folder from builder stage
COPY --from=builder /app/dist ./dist

EXPOSE 3001

# Command to sync DB schema and run the application
CMD ["sh", "-c", "npx prisma db push && npm run start:prod"]
