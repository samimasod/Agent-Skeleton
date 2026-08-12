# Amazon Web Services (AWS) Deployment Guide

This guide details how to deploy the **Multi-Tenant Application Skeleton** on AWS using containerized, highly available cloud infrastructure.

---

## 1. Target AWS Infrastructure Architecture

| Service Component | AWS Infrastructure Resource | Description |
| :--- | :--- | :--- |
| **Main API (`apps/api`)** | **AWS ECS Fargate / App Runner** | Containerized serverless FastAPI service running behind an Application Load Balancer (ALB). |
| **SuperAdmin API (`apps/api_admin`)** | **AWS ECS Fargate** | Dedicated private ECS service for platform telemetry & monitoring. |
| **Database** | **AWS RDS PostgreSQL / Aurora Serverless v2** | Multi-AZ managed PostgreSQL cluster with automated snapshots and encryption at rest. |
| **Object Storage** | **Amazon S3** | Private bucket for tenant uploads, attachments, and logs (`s3` provider). |
| **Cache Backend** | **Amazon ElastiCache (Redis)** | Managed Redis cluster in private VPC subnets. |
| **Secrets & Keys** | **AWS Secrets Manager / SSM Parameter Store** | Secure configuration storage for DB credentials and API keys. |
| **Web Apps (`apps/web`, `apps/admin`)** | **AWS S3 + CloudFront CDN** | Static SPA deployment with HTTPS global edge distribution. |

---

## 2. AWS Environment Configuration (`apps/api/config.py`)

Set the following environment variables in your ECS Task Definitions or App Runner service settings:

```bash
# AWS RDS Connection Settings
DATABASE_URL=postgresql+asyncpg://<db_user>:<db_password>@<rds_endpoint>:5432/<db_name>
DATABASE_ENV=aws

# Amazon S3 Bucket Configuration
STORAGE_PROVIDER=s3
S3_BUCKET_NAME=my-skeleton-s3-bucket
AWS_REGION=us-east-1

# ElastiCache Redis Configuration
CACHE_BACKEND=redis
REDIS_URL=redis://my-elasticache-cluster.xxx.0001.use1.cache.amazonaws.com:6379/0

# LLM Gateway Settings
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=arn:aws:ssm:us-east-1:123456789012:parameter/skeleton/openrouter_api_key

# SuperAdmin Microservice Settings
ADMIN_AUTH_ENABLED=true
SUPER_ADMIN_API_KEY=sk_admin_secret_key_prod_xxxx
SUPER_ADMIN_EMAILS=["admin@mycompany.com"]
```

---

## 3. Deployment Steps

### Step 1: Create Amazon S3 Bucket

```bash
aws s3api create-bucket \
    --bucket my-skeleton-s3-bucket \
    --region us-east-1
```

### Step 2: Push Images to Amazon ECR (Elastic Container Registry)

```bash
# Authenticate Docker to AWS ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# Create ECR repositories
aws ecr create-repository --repository-name skeleton-api
aws ecr create-repository --repository-name skeleton-admin-api

# Tag and push Docker images
docker tag skeleton-api:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/skeleton-api:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/skeleton-api:latest

docker tag skeleton-admin-api:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/skeleton-admin-api:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/skeleton-admin-api:latest
```

### Step 3: Deploy AWS ECS Fargate Services

1. Register ECS Task Definition referencing your ECR image URI and environment variables.
2. Create ECS Service attached to your AWS Application Load Balancer (ALB).

### Step 4: Run Database Migrations

Run database migrations against AWS RDS PostgreSQL from a bastion host or ECS Migration Task:

```bash
DATABASE_URL="postgresql+asyncpg://<db_user>:<db_password>@<rds_endpoint>:5432/<db_name>" \
.venv/bin/python -m alembic -c apps/api/migrations/alembic.ini upgrade head
```
