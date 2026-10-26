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

Once you get a reply to that command, you can enter `docker compose up --build -d` to build the frontend and backend images from their Dockerfiles, install all dependencies and run all the services set in the Docker Compose: frontend, API, PostgreSQL, MySQL and MongoDB.

The application is then available at http://localhost:5173.

Anytime after that just type `docker compose up -d` to run the containers in the detached mode. Add `--build` again after a change in `frontend/` or `api/` so the images are rebuilt.
`docker images` will list all the images present in our docker. 

To check that the containers are running healthily: `docker compose ps`. This lists the containers running and their state.

To check backend logs :
`docker compose logs -f backend`.

To check frontend logs (nginx) :
`docker compose logs -f frontend`.

Finally, to stop the containers type `docker compose down`.
