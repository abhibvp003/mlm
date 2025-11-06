#!/bin/bash

# Script to login to Docker Hub, pull MLM images, and test them
# Usage: ./test-dockerhub-images.sh [dockerhub-username] [dockerhub-token]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get Docker Hub credentials from arguments or environment variables
DOCKERHUB_USERNAME=${1:-${DOCKERHUB_USERNAME:-"abhibvp003"}}
# Docker Hub token: provide via arg or env var; will prompt if missing
DOCKERHUB_TOKEN=${2:-${DOCKERHUB_TOKEN:-""}}
TAG=${3:-"latest"}

# Image names
BACKEND_IMAGE="${DOCKERHUB_USERNAME}/mlm-backend"
FRONTEND_IMAGE="${DOCKERHUB_USERNAME}/mlm-frontend"

echo "=========================================="
echo "Docker Hub Login and Image Testing"
echo "Username: $DOCKERHUB_USERNAME"
echo "Tag: $TAG"
echo "=========================================="

# Step 1: Login to Docker Hub
echo ""
echo -e "${YELLOW}Step 1: Logging into Docker Hub...${NC}"
if [ -z "$DOCKERHUB_TOKEN" ]; then
    echo "Docker Hub token not provided."
    read -sp "Enter your Docker Hub token: " DOCKERHUB_TOKEN
    echo ""
    if [ -z "$DOCKERHUB_TOKEN" ]; then
        echo -e "${RED}Error: Docker Hub token is required${NC}"
        exit 1
    fi
fi

echo "$DOCKERHUB_TOKEN" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Successfully logged into Docker Hub${NC}"
else
    echo -e "${RED}✗ Failed to login to Docker Hub${NC}"
    exit 1
fi

# Step 2: Pull images
echo ""
echo -e "${YELLOW}Step 2: Pulling images from Docker Hub...${NC}"

echo "Pulling backend image..."
if docker pull "${BACKEND_IMAGE}:${TAG}"; then
    echo -e "${GREEN}✓ Successfully pulled ${BACKEND_IMAGE}:${TAG}${NC}"
else
    echo -e "${RED}✗ Failed to pull backend image${NC}"
    exit 1
fi

echo "Pulling frontend image..."
if docker pull "${FRONTEND_IMAGE}:${TAG}"; then
    echo -e "${GREEN}✓ Successfully pulled ${FRONTEND_IMAGE}:${TAG}${NC}"
else
    echo -e "${RED}✗ Failed to pull frontend image${NC}"
    exit 1
fi

# Step 3: Stop and remove existing containers (if any)
echo ""
echo -e "${YELLOW}Step 3: Cleaning up existing containers...${NC}"
docker stop mlm-backend mlm-frontend 2>/dev/null || true
docker rm mlm-backend mlm-frontend 2>/dev/null || true
echo -e "${GREEN}✓ Cleanup complete${NC}"

# Step 4: Check if config.env exists
echo ""
echo -e "${YELLOW}Step 4: Checking configuration...${NC}"
if [ ! -f "./server/config.env" ]; then
    echo -e "${YELLOW}⚠ Warning: server/config.env not found${NC}"
    echo "Creating a minimal config.env for testing..."
    mkdir -p ./server
    cat > ./server/config.env << EOF
PORT=5001
MONGODB_URI=mongodb://localhost:27017/mlm_system
JWT_SECRET=test_jwt_secret_for_docker_testing_only
NODE_ENV=production
FRONTEND_URL=http://localhost:8080
EOF
    echo -e "${GREEN}✓ Created minimal config.env${NC}"
    echo -e "${YELLOW}⚠ Note: Update MONGODB_URI with your actual MongoDB connection string${NC}"
else
    echo -e "${GREEN}✓ Found server/config.env${NC}"
fi

# Step 5: Start backend container
echo ""
echo -e "${YELLOW}Step 5: Starting backend container...${NC}"

# Read important env values from config.env and pass explicitly to container
# This ensures the values are applied even if --env-file handling differs across hosts
MONGODB_URI_VAL="mongodb+srv://abhibiswasbvp_db_user:TTvmxrR4BLWpikR5@mlm.phdeccd.mongodb.net/mlm_system?retryWrites=true&w=majority&appName=mlm"
JWT_SECRET_VAL="$(grep -E '^JWT_SECRET=' ./server/config.env | sed 's/^JWT_SECRET=//')"
NODE_ENV_VAL="$(grep -E '^NODE_ENV=' ./server/config.env | sed 's/^NODE_ENV=//')"
FRONTEND_URL_VAL="$(grep -E '^FRONTEND_URL=' ./server/config.env | sed 's/^FRONTEND_URL=//')"

# Sensible fallbacks if any are missing
[ -z "$NODE_ENV_VAL" ] && NODE_ENV_VAL=production
[ -z "$FRONTEND_URL_VAL" ] && FRONTEND_URL_VAL=http://localhost:8080

docker run -d \
    --name mlm-backend \
    -p 5001:5001 \
    --env-file ./server/config.env \
    -e MONGODB_URI="$MONGODB_URI_VAL" \
    -e JWT_SECRET="$JWT_SECRET_VAL" \
    -e NODE_ENV="$NODE_ENV_VAL" \
    -e PORT=5001 \
    -e FRONTEND_URL="$FRONTEND_URL_VAL" \
    "${BACKEND_IMAGE}:${TAG}"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend container started${NC}"
else
    echo -e "${RED}✗ Failed to start backend container${NC}"
    exit 1
fi

# Wait for backend to start and check logs
echo "Waiting for backend to initialize..."
sleep 10

# Check backend logs for MongoDB connection
echo ""
echo "Checking backend logs for MongoDB connection..."
# Wait a bit more and check logs multiple times
for i in 1 2 3; do
    sleep 2
    BACKEND_LOGS=$(docker logs mlm-backend 2>&1)
    if echo "$BACKEND_LOGS" | grep -q "Connected to MongoDB successfully"; then
        echo -e "${GREEN}✓ MongoDB connection successful${NC}"
        MONGODB_CONNECTED=true
        break
    elif echo "$BACKEND_LOGS" | grep -q "MongoDB connection error\|MongooseServerSelectionError\|buffering timed out"; then
        echo -e "${YELLOW}⚠ MongoDB connection failed - this will cause login errors${NC}"
        echo -e "${YELLOW}  Please check your MONGODB_URI in server/config.env${NC}"
        echo -e "${YELLOW}  Make sure your IP is whitelisted in MongoDB Atlas${NC}"
        MONGODB_CONNECTED=false
        break
    fi
    if [ $i -eq 3 ]; then
        echo -e "${YELLOW}⚠ Could not determine MongoDB connection status from logs${NC}"
        echo "Recent backend logs:"
        docker logs mlm-backend --tail 10
        MONGODB_CONNECTED=false
    fi
done

# Step 6: Start frontend container
echo ""
echo -e "${YELLOW}Step 6: Starting frontend container...${NC}"
docker run -d \
    --name mlm-frontend \
    -p 8080:80 \
    --link mlm-backend:backend \
    "${FRONTEND_IMAGE}:${TAG}"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend container started${NC}"
else
    echo -e "${RED}✗ Failed to start frontend container${NC}"
    exit 1
fi

# Step 7: Test containers
echo ""
echo -e "${YELLOW}Step 7: Testing containers...${NC}"
sleep 3

# Check if containers are running
BACKEND_RUNNING=$(docker ps --filter "name=mlm-backend" --filter "status=running" --format "{{.Names}}" | wc -l | tr -d ' ')
FRONTEND_RUNNING=$(docker ps --filter "name=mlm-frontend" --filter "status=running" --format "{{.Names}}" | wc -l | tr -d ' ')

if [ "$BACKEND_RUNNING" -eq 1 ]; then
    echo -e "${GREEN}✓ Backend container is running${NC}"
else
    echo -e "${RED}✗ Backend container is not running${NC}"
    echo "Backend logs:"
    docker logs mlm-backend --tail 30
    exit 1
fi

if [ "$FRONTEND_RUNNING" -eq 1 ]; then
    echo -e "${GREEN}✓ Frontend container is running${NC}"
else
    echo -e "${RED}✗ Frontend container is not running${NC}"
    echo "Frontend logs:"
    docker logs mlm-frontend --tail 20
    exit 1
fi

# Test backend health endpoint
echo ""
echo "Testing backend health endpoint..."
HEALTH_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" http://localhost:5001/api/health 2>/dev/null || echo "HTTP_CODE:000")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | sed 's/HTTP_CODE:[0-9]*$//')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Backend health check passed${NC}"
    echo "  Response: $HEALTH_BODY"
else
    echo -e "${YELLOW}⚠ Backend health check failed (HTTP $HTTP_CODE)${NC}"
    if [ "$HTTP_CODE" = "000" ]; then
        echo "  Backend may still be starting up..."
    fi
fi

# Test backend API root
echo "Testing backend API connectivity..."
if curl -s -f http://localhost:5001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend API is responding${NC}"
else
    echo -e "${YELLOW}⚠ Backend API may not be fully ready${NC}"
fi

# Test frontend
echo "Testing frontend connectivity..."
if curl -s -f http://localhost:8080 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is responding${NC}"
else
    echo -e "${YELLOW}⚠ Frontend may not be fully ready yet${NC}"
fi

# Test login endpoint
echo ""
echo "Testing login endpoint..."
LOGIN_TEST=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST http://localhost:5001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test"}' 2>/dev/null || echo "HTTP_CODE:000")
LOGIN_HTTP_CODE=$(echo "$LOGIN_TEST" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
LOGIN_BODY=$(echo "$LOGIN_TEST" | sed 's/HTTP_CODE:[0-9]*$//')

if [ "$LOGIN_HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✓ Login endpoint is working (401 = invalid credentials, which is expected)${NC}"
    if [ "$MONGODB_CONNECTED" = false ]; then
        echo -e "${YELLOW}  Note: MongoDB not connected, but endpoint responded${NC}"
    fi
elif [ "$LOGIN_HTTP_CODE" = "500" ]; then
    echo -e "${RED}✗ Login endpoint returned server error (500)${NC}"
    if [ -n "$LOGIN_BODY" ]; then
        echo "  Error response: $LOGIN_BODY"
    fi
    echo ""
    echo "Checking backend logs for login errors..."
    docker logs mlm-backend --tail 15 | grep -i -A 5 "login\|error\|mongoose" || docker logs mlm-backend --tail 15
    if [ "$MONGODB_CONNECTED" = false ]; then
        echo ""
        echo -e "${YELLOW}Root cause: MongoDB connection failed${NC}"
        echo -e "${YELLOW}  Fix: Update MONGODB_URI in server/config.env and ensure IP is whitelisted${NC}"
    fi
elif [ "$LOGIN_HTTP_CODE" = "000" ]; then
    echo -e "${YELLOW}⚠ Could not connect to login endpoint (backend may still be starting)${NC}"
else
    echo -e "${YELLOW}⚠ Login endpoint returned status: $LOGIN_HTTP_CODE${NC}"
    if [ -n "$LOGIN_BODY" ]; then
        echo "  Response: $LOGIN_BODY"
    fi
fi

# Step 8: Display container status and logs
echo ""
echo "=========================================="
echo -e "${GREEN}Container Status:${NC}"
echo "=========================================="
docker ps --filter "name=mlm-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=========================================="
echo -e "${GREEN}Test Summary:${NC}"
echo "=========================================="
echo "Backend Image:  ${BACKEND_IMAGE}:${TAG}"
echo "Frontend Image: ${FRONTEND_IMAGE}:${TAG}"
echo ""
echo "Backend URL:    http://localhost:5001"
echo "Frontend URL:   http://localhost:8080"
echo ""
if [ "$MONGODB_CONNECTED" = true ]; then
    echo -e "MongoDB Status: ${GREEN}Connected${NC}"
else
    echo -e "MongoDB Status: ${RED}Not Connected${NC}"
    echo ""
    echo -e "${YELLOW}Troubleshooting MongoDB Connection:${NC}"
    echo "1. Check server/config.env file for MONGODB_URI"
    echo "2. Verify MongoDB Atlas IP whitelist includes your IP"
    echo "3. Check MongoDB connection string format"
    echo "4. View backend logs: docker logs mlm-backend"
    echo ""
    echo -e "${YELLOW}Note: Login will fail until MongoDB is connected${NC}"
fi
echo ""
echo "To view logs:"
echo "  docker logs mlm-backend"
echo "  docker logs mlm-frontend"
echo ""
echo "To view backend logs (last 50 lines):"
echo "  docker logs mlm-backend --tail 50"
echo ""
echo "To stop containers:"
echo "  docker stop mlm-backend mlm-frontend"
echo ""
echo "To remove containers:"
echo "  docker rm mlm-backend mlm-frontend"
echo ""
echo "To restart with updated config:"
echo "  docker stop mlm-backend mlm-frontend"
echo "  docker rm mlm-backend mlm-frontend"
echo "  ./test-dockerhub-images.sh"
echo "=========================================="

