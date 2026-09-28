# ---------------------------------------------------------------------------
# Stage 1: build the React frontend
# ---------------------------------------------------------------------------
FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2: Python runtime that serves the API + compiled frontend
# ---------------------------------------------------------------------------
FROM python:3.12-slim AS runtime
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    APP_PORT=17432 \
    LOG_LEVEL=info

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl unzip \
    && curl -fsSL https://deno.land/install.sh | sh -s -- -y \
    && rm -rf /var/lib/apt/lists/*

# yt-dlp (2026+) uses deno as a JS runtime to solve YouTube's nsig challenges.
ENV PATH="/root/.deno/bin:${PATH}"

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./
COPY --from=frontend /app/frontend/dist ./frontend/dist

EXPOSE 17432

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${APP_PORT:-17432}"]
