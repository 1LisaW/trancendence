DOCKER_COMPOSE = docker compose

DOCKER = docker

down:
	$(DOCKER_COMPOSE) down
up:
	$(DOCKER_COMPOSE) up

reboot: down rm_images
	$(DOCKER_COMPOSE) up

IMAGES = $(shell docker images -qa)

EMPTY =

rm_containers:
	shell $(DOCKER) rm -vf `docker ps -aq`

rm_images:
ifeq ($(IMAGES), $(EMPTY))
	echo "No images to delete\n"
else
	docker rmi -f $(IMAGES)
endif

rm_all:
	rm_images