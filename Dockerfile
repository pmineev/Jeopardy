FROM node:17.6-slim as frontend-builder

LABEL name=frontend-builder

WORKDIR /frontend
COPY frontend .

RUN npm install && npm run build

FROM python:3.10-slim as backend-installer

LABEL name=backend-installer

WORKDIR /app
COPY manage.py requirements.txt ./

RUN  apt-get update \
     && apt-get install -y --no-install-recommends libpq5 libpq-dev gcc libc6-dev \
     && pip install --upgrade --no-cache-dir  pip \
     && pip install --no-cache-dir -r requirements.txt \
     && apt-get remove -y libpq-dev gcc libc6-dev \
     && apt-get clean autoclean \
     && apt-get autoremove -y \
     && rm -rf /var/lib/apt/lists/*

FROM backend-installer

LABEL name=backend

ENV DJANGO_SETTINGS_MODULE=backend.config.settings

WORKDIR /app
COPY --from=frontend-builder frontend/build frontend/build
COPY backend backend

RUN python manage.py collectstatic --noinput