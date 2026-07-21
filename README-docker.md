# Pet-Check Docker Database Setup

To run the PostgreSQL database for this project locally, make sure Docker is running and execute the following command:

```bash
docker run --name petcheck-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=mysecretpassword -e POSTGRES_DB=petcheckdb -p 5432:5432 -d postgres