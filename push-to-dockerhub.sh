#!/bin/bash

# Script to build, tag, and push MLM images to Docker Hub
# Usage: ./push-to-dockerhub.sh [dockerhub-username] [tag]

set -e

# Get Docker Hub username from argument or environment variable
DOCKERHUB_USERNAME=${1:-${DOCKERHUB_USERNAME:-""}}
TAG=${2:-"latest"}

# If username not provided, prompt for it
if [ -z "$DOCKERHUB_USERNAME" ]; then
    echo "Docker Hub username not provided."
    read -p "Enter your Docker Hub username: " DOCKERHUB_USERNAME
    if [ -z "$DOCKERHUB_USERNAME" ]; then
        echo "Error: Docker Hub username is required"
        exit 1
    fi
fi

echo "=========================================="
echo "Building and pushing MLM images to Docker Hub"
echo "Username: $DOCKERHUB_USERNAME"
echo "Tag: $TAG"
echo "=========================================="

# Image names
BACKEND_IMAGE="${DOCKERHUB_USERNAME}/mlm-backend"
FRONTEND_IMAGE="${DOCKERHUB_USERNAME}/mlm-frontend"

# Ensure buildx is available and a builder is set up for multi-arch
echo ""
echo "Preparing Docker Buildx for multi-arch builds (linux/amd64, linux/arm64)..."
if ! docker buildx version >/dev/null 2>&1; then
  echo "Error: docker buildx is not available. Please update Docker to a version that supports buildx."
  exit 1
fi

# Create and use a dedicated builder if not present
if ! docker buildx inspect mlm-builder >/dev/null 2>&1; then
  docker buildx create --name mlm-builder --use >/dev/null
else
  docker buildx use mlm-builder >/dev/null
fi

# Boot the builder (ensures QEMU emulation is ready)
docker buildx inspect --bootstrap >/dev/null

# Build and push multi-arch images
PLATFORMS="linux/amd64,linux/arm64"

echo ""
echo "Building and pushing backend image for platforms: $PLATFORMS ..."
docker buildx build \
  --platform ${PLATFORMS} \
  -t ${BACKEND_IMAGE}:${TAG} \
  -t ${BACKEND_IMAGE}:latest \
  ./server \
  --push

echo ""
echo "Building and pushing frontend image for platforms: $PLATFORMS ..."
docker buildx build \
  --platform ${PLATFORMS} \
  -t ${FRONTEND_IMAGE}:${TAG} \
  -t ${FRONTEND_IMAGE}:latest \
  ./client \
  --push

# Login to Docker Hub (if not already logged in)
echo ""
echo "Checking Docker Hub login status..."
if ! docker info | grep -q "Username"; then
    echo "Please login to Docker Hub..."
    docker login
fi

# Note: Images were pushed by buildx during the build step above

echo ""
echo "=========================================="
echo "Successfully pushed images to Docker Hub!"
echo "Backend:  ${BACKEND_IMAGE}:${TAG}"
echo "Frontend: ${FRONTEND_IMAGE}:${TAG}"
echo "=========================================="

