# Installing and running Docker

## Prerequisites to using Docker:

### Installing Docker Desktop on MAC:
Go to `https://docs.docker.com/desktop/setup/install/mac-install/`, follow the instructions, please read the **Before you install or update** section. 

### Installing Docker Desktop on Windows:
Docker runs on linux environment, this can be done using wsl 2 on windows OS.
Go to `https://docs.docker.com/desktop/setup/install/windows-install/`, follow the instructions.

### Installing Docker on linux:
Go to `https://docs.docker.com/desktop/setup/install/linux/` and follow the instructions.

## Commands to get the container running

Check that docker is installed properly: `docker --version`

Once you get a reply to that command, you can enter `docker compose up -d` to build images and run the containers.

to check that the containers are running healthily: `docker compose ps`. This lists the containers running and their state.
