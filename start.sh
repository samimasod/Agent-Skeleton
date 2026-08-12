#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

BACKEND_PID=""
ADMIN_BACKEND_PID=""
FRONTEND_PID=""
ADMIN_FRONTEND_PID=""
FRONTEND_PORT="5173"
ADMIN_FRONTEND_PORT="3001"

cleanup() {
  local exit_code=$?

  if [[ -n "${FRONTEND_PID}" ]] && kill -0 "${FRONTEND_PID}" 2>/dev/null; then
    kill "${FRONTEND_PID}" 2>/dev/null || true
  fi

  if [[ -n "${ADMIN_FRONTEND_PID}" ]] && kill -0 "${ADMIN_FRONTEND_PID}" 2>/dev/null; then
    kill "${ADMIN_FRONTEND_PID}" 2>/dev/null || true
  fi

  if [[ -n "${BACKEND_PID}" ]] && kill -0 "${BACKEND_PID}" 2>/dev/null; then
    kill "${BACKEND_PID}" 2>/dev/null || true
  fi

  if [[ -n "${ADMIN_BACKEND_PID}" ]] && kill -0 "${ADMIN_BACKEND_PID}" 2>/dev/null; then
    kill "${ADMIN_BACKEND_PID}" 2>/dev/null || true
  fi

  wait 2>/dev/null || true
  exit "${exit_code}"
}

trap cleanup EXIT INT TERM

find_free_port() {
  local port="$1"
  while lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; do
    port=$((port + 1))
  done
  echo "$port"
}

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is required but not installed." >&2
  exit 1
fi

# Ensure virtual environment exists
if [[ ! -d "$ROOT_DIR/.venv" ]]; then
  echo "Virtual environment not found. Creating one..." >&2
  if command -v uv >/dev/null 2>&1; then
    uv venv "$ROOT_DIR/.venv"
  else
    if command -v python3 >/dev/null 2>&1; then
      python3 -m venv "$ROOT_DIR/.venv"
    else
      echo "python3 is required but not installed." >&2
      exit 1
    fi
  fi
fi

PYTHON_BIN="$ROOT_DIR/.venv/bin/python"

# Verify or install dependencies automatically
if ! "$PYTHON_BIN" -c "import uvicorn" >/dev/null 2>&1; then
  echo "Backend dependencies missing. Installing requirements..." >&2
  if command -v uv >/dev/null 2>&1; then
    uv pip install --python "$PYTHON_BIN" -r "$ROOT_DIR/requirements.txt"
  else
    "$ROOT_DIR/.venv/bin/pip" install -r "$ROOT_DIR/requirements.txt"
  fi
fi

if [[ ! -d "$ROOT_DIR/node_modules" || ! -d "$ROOT_DIR/apps/web/node_modules" || ! -d "$ROOT_DIR/apps/admin/node_modules" ]]; then
  echo "Frontend dependencies missing. Running pnpm install..." >&2
  pnpm install
fi

if lsof -nP -iTCP:8000 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port 8000 is already in use. Stop the existing process or change API_PORT." >&2
  exit 1
fi

FRONTEND_PORT="$(find_free_port 5173)"
ADMIN_FRONTEND_PORT="$(find_free_port 3001)"

echo "Starting main API backend on http://localhost:8000"
DATABASE_ENV="${DATABASE_ENV:-local}" "$PYTHON_BIN" -m uvicorn apps.api.main:app --reload &
BACKEND_PID=$!

echo "Starting SuperAdmin API microservice on http://localhost:8001"
DATABASE_ENV="${DATABASE_ENV:-local}" "$PYTHON_BIN" -m uvicorn apps.api_admin.main:app --port 8001 --reload &
ADMIN_BACKEND_PID=$!

echo "Starting main Web application on http://localhost:${FRONTEND_PORT}"
if [[ "${FRONTEND_PORT}" == "5173" ]]; then
  pnpm dev:web &
else
  pnpm --filter @skeleton/web exec vite --host 0.0.0.0 --port "${FRONTEND_PORT}" &
fi
FRONTEND_PID=$!

echo "Starting SuperAdmin Web portal on http://localhost:${ADMIN_FRONTEND_PORT}"
if [[ "${ADMIN_FRONTEND_PORT}" == "3001" ]]; then
  pnpm dev:admin &
else
  pnpm --filter @skeleton/admin exec vite --host 0.0.0.0 --port "${ADMIN_FRONTEND_PORT}" &
fi
ADMIN_FRONTEND_PID=$!

echo "Main Backend PID: ${BACKEND_PID}"
echo "SuperAdmin Backend PID: ${ADMIN_BACKEND_PID}"
echo "Main Frontend PID: ${FRONTEND_PID}"
echo "SuperAdmin Frontend PID: ${ADMIN_FRONTEND_PID}"
echo ""
echo "Main Web App URL: http://localhost:${FRONTEND_PORT}"
echo "Main API URL: http://localhost:8000"
echo "SuperAdmin Web URL: http://localhost:${ADMIN_FRONTEND_PORT}"
echo "SuperAdmin API URL: http://localhost:8001"
echo ""
echo "Press Ctrl+C to stop all processes."

wait "${BACKEND_PID}" "${ADMIN_BACKEND_PID}" "${FRONTEND_PID}" "${ADMIN_FRONTEND_PID}"