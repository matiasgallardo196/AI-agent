# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies and generate prisma client (optimized RUN)
RUN npm ci && npx prisma generate

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

# Install only production dependencies and generate client
RUN npm ci --omit=dev && npx prisma generate

# Copy generated dist folder from builder stage
COPY --from=builder /app/dist ./dist

# Change ownership of all output files to the pre-existing 'node' non-root user
RUN chown -R node:node /app

# Switch to non-root user for security
USER node

# Add Healthcheck (ensure container is active)
# We test connection using standard node http request 
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001', (r) => {if(r.statusCode !== 200 && r.statusCode !== 404) process.exit(1)}).on('error', () => process.exit(1))"

EXPOSE 3001

# Removed risky "prisma db push" from start command as recommended
# Run your migrations safely in Coolify using its pre-deploy scripts
CMD ["npm", "run", "start:prod"]
