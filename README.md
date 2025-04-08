# trancendence

## Setting up the Environment

1. **Create `.env` files**:
   - Create a `.env` file in the root directory of the project.
   - Add the necessary environment variables. For example:
     ```
     DATABASE_URL=your_database_url
     SECRET_KEY=your_secret_key
     TOKEN_SECRET=your_token_secret  # Used by the authentication microservice for signing tokens
     ```
   - Refer to the project documentation or team lead for the complete list of required variables.

2. **Using the Makefile to Run Docker Containers**:
   - Ensure you have Docker and `make` installed on your system.
   - Use the following commands:
     - `make build`: Build the Docker containers.
     - `make up`: Start the Docker containers.
     - `make down`: Stop the Docker containers.
     - `make logs`: View the logs of the running containers.
     - `make rm_images`: Remove Docker images to ensure they are updated during the development process.
   - Check the `Makefile` for additional commands and their descriptions.

For further assistance, contact the development team.
