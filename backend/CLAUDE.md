- Any request to a protected endpoint without a valid JWT in headers will receive a 401 Unauthorized response. You can obtain a JWT by logging in via the `/auth/login` endpoint using the credentials `{ "email": "admin@test.com", "password": "password"}`
- You can find the database schema in `backend/internal/database/schema.md` - if you make changes to the database, please update this file accordingly.
- To connect to the PostgreSQL database directly, you can use the following command:
	`/opt/homebrew/bin/psql "the_DATABASE_URL_connection_string_from_.env" -c "YOUR_SQL_QUERY_HERE"`
- Always verify your backend changes by running some sample requests using CURL.
- If you need to make changes you gotta kill any existing backend process first then rebuild and run it again using `go build -o bin/flex-erp-backend ./cmd/server`
