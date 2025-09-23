
- Whenever new functionality is planned you should update the appropriate spec file (in case it already exists) from `docs` with functional and non functional requirements, deliverables and steps to follow, then `docs/functional-details.md` file MUST be updated once implemented. 
- Don't use the `npm run dev` command instead use `npm run frontend:dev` and `npm run backend:dev` separately to avoid unnecessary rebuilds. You can use the `/health` endpoint to check if the backend is running.
