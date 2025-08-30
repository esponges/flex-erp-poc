# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN go build -o bin/flex-erp-backend ./cmd/server

# Runtime stage
FROM alpine:latest

# Install ca-certificates for SSL/TLS
RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy binary from builder stage
COPY --from=builder /app/bin/flex-erp-backend .

# Expose port (Render will override this with PORT env var)
EXPOSE 10000

# Run the binary
CMD ["./flex-erp-backend"]