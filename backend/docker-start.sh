#!/bin/bash

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to clean up containers and volumes
cleanup() {
    echo "Cleaning up previous containers and volumes..."
    docker-compose down -v
}

# Main script
check_docker

# Check if cleanup is requested
if [ "$1" == "clean" ]; then
    cleanup
fi

# Start the services
echo "Starting services..."
docker-compose up --build

# Handle script interruption
trap 'docker-compose down' INT TERM 