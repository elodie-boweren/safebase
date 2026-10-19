# Installing and running Docker

## Prerequisites to using Docker:

### Installing Docker Desktop on MAC:
Go to `https://docs.docker.com/desktop/setup/install/mac-install/`, follow the instructions, please read the **Before you install or update** section. 

### Installing Docker Desktop on Windows:
Docker runs on linux environment, this can be done using wsl 2 on windows OS.
Go to `https://docs.docker.com/desktop/setup/install/windows-install/`, follow the instructions.

### Installing Docker on linux:
Go to `https://docs.docker.com/desktop/setup/install/linux/` and follow the instructions.

## Commands for docker compose

This project uses docker compose for a fast and efficient management of containers. 

First, check that docker is installed properly: `docker --version`. 

Once you get a reply to that command, you can enter `docker compose up -d` to build images and run the containers in the detached mode.
`docker images` will list all the images present in our docker. 

To check that the containers are running healthily: `docker ps`. This lists the containers running and their state.

Finally, to stop the containers type `docker compose down`

