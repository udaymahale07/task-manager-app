# Practical 9: In-Memory Caching and Query Optimization

## Implementation

The task-list response is cached in a shared `node-cache` instance for 60
seconds. Both `GET /tasks` and `GET /api/tasks` use the same handler and cache.
Successful task creation, update, and deletion invalidate the cached list.
Caching is enabled by default; set `TASK_CACHE_ENABLED=false` when starting the
backend to collect uncached comparison readings.

The existing authenticated API response shape is preserved. In Postman, set
the request's authorization type to **Bearer Token** and provide a valid
login token.

## Postman measurement procedure

1. From the `backend` directory, start the backend with caching enabled. In
   PowerShell, unset the benchmark flag first:

   ```powershell
   Remove-Item Env:TASK_CACHE_ENABLED -ErrorAction SilentlyContinue
   npm run dev
   ```

2. Send `GET http://localhost:5000/api/tasks` once to warm the cache; do not
   include this warm-up in the measurements.
3. Send the same GET request three times and record Postman's **Time** value.
4. Stop and restart the backend with caching disabled:

   ```powershell
   $env:TASK_CACHE_ENABLED = "false"
   npm run dev
   ```
   
5. Send the same GET request three times and record each **Time** value.
6. Calculate each case's mean as `(reading 1 + reading 2 + reading 3) / 3`.
   Keep the same database, request, network, and client for both sets.

| Run | Cached (ms) | Uncached (ms) |
|-----|-------------|---------------|
| 1   | Not measured | Not measured |
| 2   | Not measured | Not measured |
| 3   | Not measured | Not measured |
| Mean | Not measured | Not measured |

Replace “Not measured” with the six Postman readings and the two calculated
means after running the experiment. Do not treat these timings as a benchmark
until they have been collected in the local environment.
