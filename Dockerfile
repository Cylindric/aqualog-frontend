FROM node:26-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM python:3.14-alpine

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY pyproject.toml poetry.lock ./
RUN python -c "import tomllib; from pathlib import Path; version = tomllib.loads(Path('pyproject.toml').read_text(encoding='utf-8'))['project']['version']; Path('/app/.container-env').write_text(f'AQUALOG_APP_VERSION={version}\\n', encoding='utf-8')"
RUN pip install --upgrade pip && pip install --no-cache-dir poetry && \
    poetry config virtualenvs.create false && \
    poetry install --only main --no-interaction --no-ansi
COPY backend /app/backend
COPY --from=build /app/dist /app/frontend

EXPOSE 8000

CMD ["sh", "-c", "set -a && . /app/.container-env && set +a && exec uvicorn backend.main:app --host 0.0.0.0 --port 8000"]
