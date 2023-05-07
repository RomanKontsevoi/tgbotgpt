# Define the name of the docker image (and container)
IMAGE_NAME = tgbotgpt

# Build the docker image from the Dockerfile
build:
	docker build -t $(IMAGE_NAME) .

# Run the docker container from the image
run:
	docker run -d -p 3000:3000 --name $(IMAGE_NAME) --rm $(IMAGE_NAME)

# Stop the docker container
stop:
	docker stop -t 5 $(IMAGE_NAME)

restart: stop run
