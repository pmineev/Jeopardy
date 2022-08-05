FROM node:17.6-slim as frontend-base

LABEL name=frontend-base

ARG HOST

WORKDIR /frontend

COPY frontend/package*.json ./
RUN npm install

FROM frontend-base as frontend-build

LABEL name=frontend-builder

ARG HOST
ENV REACT_APP_API_HOST=${HOST}

WORKDIR /frontend

COPY frontend .
RUN npm run build

FROM python:3.10-slim as backend-base

LABEL name=backend-base

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

ENV PYTHONUNBUFFERED 1

FROM backend-base as backend-prod

LABEL name=backend-prod

ENV DJANGO_SETTINGS_MODULE=backend.config.settings

WORKDIR /app
COPY --from=frontend-build frontend/build frontend/build
COPY backend backend

RUN python manage.py collectstatic --noinput

FROM backend-base as backend-dev

LABEL name=backend-dev

ENV DJANGO_SETTINGS_MODULE=backend.config.settings

WORKDIR /app