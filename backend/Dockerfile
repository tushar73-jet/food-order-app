# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code
COPY . .

# Stage 2: Runner
FROM node:20-alpine AS runner

WORKDIR /app

# Copy built dependencies and prisma client
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Command runs the build step (runs migrations) and starts the app
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
