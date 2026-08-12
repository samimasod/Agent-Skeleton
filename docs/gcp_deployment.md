# Google Cloud Platform (GCP) Deployment Guide

This guide details how to deploy the **Multi-Tenant Application Skeleton** on Google Cloud Platform using serverless, scalable GCP services.

---

## 1. Target GCP Infrastructure Architecture

| Service Component | GCP Infrastructure Resource | Description |
| :--- | :--- | :--- |
| **Main API (`apps/api`)** | **Google Cloud Run** | Containerized serverless FastAPI service with auto-scaling (0–100+ instances). |
| **SuperAdmin API (`apps/api_admin`)** | **Google Cloud Run** | Dedicated Cloud Run microservice on private VPC connector. |
| **Database** | **GCP Cloud SQL (PostgreSQL 16)** | Managed PostgreSQL with automatic failover, daily backups, and Cloud SQL Auth Proxy. |
| **Object Storage** | **Google Cloud Storage (GCS)** | Private bucket for tenant assets and agent artifacts (`gcs` provider). |
| **Cache Backend** | **Google Cloud Memorystore (Redis)** | Managed Redis cluster for reactive caching and pub/sub messaging. |
| **Secrets & Keys** | **GCP Secret Manager** | Secure storage for DB passwords, API keys, and Firebase Admin SDK credentials. |
| **Web Apps (`apps/web`, `apps/admin`)** | **Firebase Hosting / Cloud Storage CDN** | Static SPA distribution with global edge caching. |

---

## 2. GCP Environment Configuration (`apps/api/config.py`)

Set the following environment variables in your Cloud Run revision or Secret Manager:

```bash
# Cloud SQL Connection Settings
DATABASE_URL=postgresql+asyncpg://<db_user>:<db_password>@localhost:5432/<db_name>?host=/cloudsql/<project_id>:<region>:<instance_id>
DATABASE_ENV=gcp

# Google Cloud Storage Configuration
STORAGE_PROVIDER=gcs
GCS_BUCKET_NAME=my-skeleton-gcs-bucket
GCP_PROJECT_ID=my-gcp-project-id

# Cache & Redis Configuration
CACHE_BACKEND=redis
REDIS_URL=redis://10.x.x.x:6379/0

# LLM Gateway
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=projects/<project_number>/secrets/openrouter-api-key/versions/latest

# SuperAdmin Microservice Settings
ADMIN_AUTH_ENABLED=true
SUPER_ADMIN_API_KEY=sk_admin_secret_key_prod_xxxx
SUPER_ADMIN_EMAILS=["admin@mycompany.com"]
```

---

## 3. Deployment Steps

### Step 1: Provision GCP Resources via gcloud CLI

```bash
# Set default project & region
gcloud config set project MY_GCP_PROJECT_ID
gcloud config set run/region us-central1

# Create Cloud Storage Bucket
gcloud storage buckets create gs://my-skeleton-gcs-bucket --location=us-central1 --uniform-bucket-level-access

# Create Cloud SQL PostgreSQL Instance
gcloud sql instances create skeleton-db-instance \
    --database-version=POSTGRES_16 \
    --tier=db-custom-2-7680 \
    --region=us-central1

# Create Database and User
gcloud sql databases create skeleton_prod --instance=skeleton-db-instance
gcloud sql users create skeleton_user --instance=skeleton-db-instance --password=SUPER_SECURE_PASSWORD
```

### Step 2: Build & Push Docker Container Images

```bash
# Build and submit Main API image to Artifact Registry
gcloud builds submit --tag gcr.io/MY_GCP_PROJECT_ID/skeleton-api:latest -f apps/api/Dockerfile .

# Build and submit SuperAdmin API image
gcloud builds submit --tag gcr.io/MY_GCP_PROJECT_ID/skeleton-admin-api:latest -f apps/api_admin/Dockerfile .
```

### Step 3: Deploy to Cloud Run

```bash
# Deploy Main API to Cloud Run
gcloud run deploy skeleton-api \
    --image gcr.io/MY_GCP_PROJECT_ID/skeleton-api:latest \
    --add-cloudsql-instances MY_GCP_PROJECT_ID:us-central1:skeleton-db-instance \
    --set-env-vars DATABASE_ENV=gcp,STORAGE_PROVIDER=gcs,GCS_BUCKET_NAME=my-skeleton-gcs-bucket \
    --allow-unauthenticated

# Deploy SuperAdmin API to Cloud Run
gcloud run deploy skeleton-admin-api \
    --image gcr.io/MY_GCP_PROJECT_ID/skeleton-admin-api:latest \
    --add-cloudsql-instances MY_GCP_PROJECT_ID:us-central1:skeleton-db-instance \
    --allow-unauthenticated
```

### Step 4: Run Database Migrations

Run database migrations against Cloud SQL using the Cloud SQL Auth Proxy:

```bash
# Start Cloud SQL Auth Proxy
cloud-sql-proxy MY_GCP_PROJECT_ID:us-central1:skeleton-db-instance --port 5432 &

# Run Alembic Upgrade
DATABASE_URL="postgresql+asyncpg://skeleton_user:SUPER_SECURE_PASSWORD@localhost:5432/skeleton_prod" \
.venv/bin/python -m alembic -c apps/api/migrations/alembic.ini upgrade head
```
