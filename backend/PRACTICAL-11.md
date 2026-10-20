# Practical 11: Multi-Container Orchestration with Docker and Docker Compose

**CO / PO Mapping:** CO4 / PO3, PO5  
**Objective:** To containerize and orchestrate a full-stack Task Management application (React frontend, Node/Express backend, and MongoDB database) using Docker, Dockerfiles, and Docker Compose with an isolated bridge network and persistent volume storage.

---

## 1. Architectural Overview & Containerization Concepts

In modern web development, running an application with multiple moving parts (Frontend SPA, REST API backend, and Database) across different environments often leads to the *"it works on my machine"* problem. 

Docker containerization packages the code along with its runtime, system tools, libraries, and dependencies into isolated, lightweight, and reproducible containers.

### Key Concepts in Practical 11:
1. **Dockerfile (Backend):** Uses the official `node:18` base image, sets up the working directory, copies `package.json`, installs dependencies, copies source code, and starts the server via `node server.js`.
2. **Multi-stage Dockerfile (Frontend):** Uses `node:18 AS build` to install dependencies and execute `npm run build` to generate an optimized production bundle, then serves it using Vite's preview server (`npm run preview -- --host`) on port `5173`.
3. **Internal Docker Bridge Network (`app-network`):** Containers communicate with each other using their service names (DNS discovery). For example, the backend connects to MongoDB using `mongodb://mongodb:27017/taskdb` instead of `localhost`.
4. **Persistent Volumes (`mongo-data`):** Preserves MongoDB data across container restarts and rebuilds.
5. **Docker Compose (`docker-compose.yml`):** Declarative configuration defining all three services (`frontend`, `backend`, `mongodb`), their build contexts, environment variables, exposed ports, and startup dependencies (`depends_on`).

---

## 2. Configuration & Implementation Files

### A. Backend Dockerfile (`backend/Dockerfile`)
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

### B. Backend Docker Ignore (`backend/.dockerignore`)
```text
node_modules
npm-debug.log
.env
```

### C. Frontend Dockerfile (`frontend/Dockerfile`)
```dockerfile
FROM node:18 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview", "--", "--host"]
```

### D. Frontend Docker Ignore (`frontend/.dockerignore`)
```text
node_modules
dist
.git
```

### E. Root Docker Compose File (`docker-compose.yml`)
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    container_name: mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    networks:
      - app-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: backend
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      - MONGO_URI=mongodb://mongodb:27017/taskdb
      - PORT=5000
      - JWT_SECRET=supersecretjwtkey_awdf_practical7
      - TASK_CACHE_ENABLED=true
    depends_on:
      - mongodb
    networks:
      - app-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: frontend
    restart: unless-stopped
    ports:
      - "5173:5173"
    depends_on:
      - backend
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  mongo-data:
    driver: local
```

### F. Backend Database Connection (`backend/server.js`)
Updated to support the Docker service name with environment variable fallback:
```javascript
const MONGO_URI = process.env.MONGO_URI || "mongodb://mongodb:27017/taskdb";
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err.message));
```

---

## 3. Step-by-Step Execution Guide

1. **Start Docker Desktop:** Ensure the Docker Desktop icon in the system tray shows "Engine Running".
2. **Verify CLI versions:**
   ```powershell
   docker --version
   docker compose version
   ```
3. **Build and Run the entire multi-container stack:**
   ```powershell
   docker compose up --build
   # or run detached in background:
   docker compose up --build -d
   ```
4. **Verify container status:**
   ```powershell
   docker ps
   ```
   All 3 containers (`mongodb`, `backend`, `frontend`) should display Status `Up`.
5. **Access the Application:**
   - **Frontend UI:** Open `http://localhost:5173` in your browser.
   - **Backend API:** Send requests to `http://localhost:5000/api/tasks`.

---

## 4. Required Screenshots for the Practical 11 Report

For your lab submission, capture the following screenshots:

### Section A: Source Code & Configuration (VS Code)
- **Figure 1:** `backend/Dockerfile` and `frontend/Dockerfile` in VS Code editor.
- **Figure 2:** `docker-compose.yml` showing service definitions for `mongodb`, `backend`, and `frontend`, network mapping, and volumes.

### Section B: Terminal & Docker Execution
- **Figure 3:** Terminal output of `docker --version` and `docker compose version`.
- **Figure 4:** Terminal output of `docker compose up --build` showing the build stages and container startup logs.
- **Figure 5:** Terminal output of `docker ps` showing all 3 containers active and healthy with port mappings (`27017->27017`, `5000->5000`, `5173->5173`).

### Section C: End-to-End Application Functionality
- **Figure 6 (Combined Postman + Terminal):** Postman sending `POST /api/tasks` returning `201 Created` alongside the backend container log showing `MongoDB connected` and event listener output.
- **Figure 7 (Browser):** Browser accessing `http://localhost:5173` displaying the React Task Manager Kanban board loaded with live data from the containerized backend.
