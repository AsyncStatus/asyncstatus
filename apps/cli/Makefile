# Build variables
BINARY_NAME=asyncstatus
VERSION ?= $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
BUILD_TIME=$(shell date -u '+%Y-%m-%d_%H:%M:%S')
GIT_COMMIT=$(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")

# -s: strip symbol table and debug information 
# -w: strip DWARF debug information
# -trimpath: remove all file system paths from the binary
# -buildmode=pie: build position independent executable (PIE) for security
# CGO_ENABLED=0: disable CGO for static linking and smaller binaries
LDFLAGS=-ldflags "-s -w -X asyncstatus.com/cli/cmd.Version=${VERSION} -X asyncstatus.com/cli/cmd.BuildTime=${BUILD_TIME} -X asyncstatus.com/cli/cmd.GitCommit=${GIT_COMMIT}"
BUILD_FLAGS=-trimpath -buildmode=pie
CGO_ENABLED=0

# Build targets
.PHONY: build build-debug build-all clean install test fmt vet lint deps run version help checksums release

build: ## Build the binary (production optimized)
	@echo "Building ${BINARY_NAME} ${VERSION} (production)..."
	CGO_ENABLED=${CGO_ENABLED} go build ${BUILD_FLAGS} ${LDFLAGS} -o bin/${BINARY_NAME} .

build-debug: ## Build the binary with debug information
	@echo "Building ${BINARY_NAME} ${VERSION} (debug)..."
	go build -ldflags "-X asyncstatus.com/cli/cmd.Version=${VERSION} -X asyncstatus.com/cli/cmd.BuildTime=${BUILD_TIME} -X asyncstatus.com/cli/cmd.GitCommit=${GIT_COMMIT}" -o bin/${BINARY_NAME}-debug .

build-all: clean ## Build for multiple platforms
	@echo "Building ${BINARY_NAME} ${VERSION} for multiple platforms..."
	mkdir -p bin
	CGO_ENABLED=${CGO_ENABLED} GOOS=linux GOARCH=amd64 go build ${BUILD_FLAGS} ${LDFLAGS} -o bin/${BINARY_NAME}-linux-amd64 .
	CGO_ENABLED=${CGO_ENABLED} GOOS=linux GOARCH=arm64 go build ${BUILD_FLAGS} ${LDFLAGS} -o bin/${BINARY_NAME}-linux-arm64 .
	CGO_ENABLED=${CGO_ENABLED} GOOS=darwin GOARCH=amd64 go build ${BUILD_FLAGS} ${LDFLAGS} -o bin/${BINARY_NAME}-darwin-amd64 .
	CGO_ENABLED=${CGO_ENABLED} GOOS=darwin GOARCH=arm64 go build ${BUILD_FLAGS} ${LDFLAGS} -o bin/${BINARY_NAME}-darwin-arm64 .
	CGO_ENABLED=${CGO_ENABLED} GOOS=windows GOARCH=amd64 go build ${BUILD_FLAGS} ${LDFLAGS} -o bin/${BINARY_NAME}-windows-amd64.exe .
	@echo "All builds completed:"
	@ls -la bin/

install: build ## Install the binary to GOPATH/bin
	@echo "Installing ${BINARY_NAME}..."
	CGO_ENABLED=${CGO_ENABLED} go install ${BUILD_FLAGS} ${LDFLAGS} .

clean: ## Clean build artifacts
	@echo "Cleaning..."
	rm -rf bin/
	go clean

checksums: build-all ## Generate checksums for release binaries
	@echo "Generating checksums..."
	cd bin && sha256sum * > checksums.txt
	@echo "Checksums generated:"
	@cat bin/checksums.txt

release: checksums ## Prepare release artifacts (used by CI)
	@echo "Release artifacts ready in bin/"

test: ## Run tests
	go test -v ./...

fmt: ## Format code
	go fmt ./...

vet: ## Run go vet
	go vet ./...

lint: ## Run linter (requires golangci-lint)
	golangci-lint run

deps: ## Download dependencies
	go mod download
	go mod tidy

run: build ## Build and run the application
	./bin/${BINARY_NAME}

version: ## Show version information
	@echo "Version: ${VERSION}"
	@echo "Build Time: ${BUILD_TIME}"
	@echo "Git Commit: ${GIT_COMMIT}"

help: ## Show this help message
	@echo "Available targets:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Default target
.DEFAULT_GOAL := build