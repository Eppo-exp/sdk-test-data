FROM golang:1.23

WORKDIR /app

# Copy go mod and sum files
COPY . .

# Download all dependencies
RUN go mod download

# Copy the source code
COPY . .

# Build the application
RUN go build -o main .

# Run the application
CMD ["./main"]
