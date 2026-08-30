# IQNexus

Same codebase, **two configurations**: local development and production (EC2).

## Local development

Uses `docker-compose.yml` with dev servers and hot reload.

```bash
cp .env.example .env          # fill AWS_KEY, AWS_SECRET (gitignored)
docker compose up -d --build
```

| Service | URL |
|---------|-----|
| Student | http://localhost:3000 |
| Admin | http://localhost:3001 |
| API | http://localhost:5001 |

**Local config files**

| File | Purpose |
|------|---------|
| `.env` | AWS S3 credentials for Docker backend (`AWS_KEY`, `AWS_SECRET`, `AWS_REGION=eu-north-1`, `AWS_BUCKET_NAME=epocho-1.2`) |
| `docker-compose.yml` | Mongo + backend + client + admin dev containers |
| `iqnexus-admin-main/.env` | `VITE_BASE_API_URL=http://localhost:5001` |
| `iqnexus-client-main/.env` | `REACT_APP_BASE_API_URL=http://localhost:5001` |

Backend code is volume-mounted — restart `backend` after server changes:

```bash
docker compose restart backend
```

---

## Production

Uses `aws-deploy/docker-compose.freetier.yml`: nginx + static frontends + backend + MongoDB on EC2.

| URL | Host |
|-----|------|
| Student | https://student.iqnexus.in |
| Admin | https://admin.iqnexus.in |
| API | `/api` on both hosts |

**Production config (on EC2, not in git)**

| File | Purpose |
|------|---------|
| `/opt/iqnexus/.env` | App S3 credentials (separate IAM user from CI deploy user) |
| `/opt/iqnexus/docker-compose.freetier.yml` | Prod stack (deployed via tarball) |

Frontends are built with `VITE_BASE_API_URL=/api` and `REACT_APP_BASE_API_URL=/api` by `aws-deploy/package.sh`.

---

## CI/CD (GitHub Actions)

| Workflow | When | What |
|----------|------|------|
| **CI** (`.github/workflows/ci.yml`) | PR/push to `main`, `master`, or `deploy` | Builds prod package (no deploy) |
| **Deploy** (`.github/workflows/deploy.yml`) | Push to those branches (app paths only) or manual | Build → S3 → SSH → `deploy-remote.sh` |

Deploy does **not** recreate EC2. It preserves `/opt/iqnexus/.env` and MongoDB data.

### GitHub secrets (Settings → Secrets → Actions → environment `production`)

| Secret | Example |
|--------|---------|
| `AWS_ACCESS_KEY_ID` | CI/deploy IAM user (artifact S3 upload) |
| `AWS_SECRET_ACCESS_KEY` | Pair for above |
| `AWS_REGION` | `eu-north-1` |
| `ARTIFACT_BUCKET` | `iqnexus-freetier-artifacts-ACCOUNT-eu-north-1` |
| `EC2_HOST` | EC2 public IP |
| `EC2_USER` | `ec2-user` |
| `EC2_SSH_KEY` | PEM private key contents |

**Do not** put app S3 upload keys in GitHub — those stay in `/opt/iqnexus/.env` on the server.

### Manual deploy from your machine

```bash
bash aws-deploy/package.sh
aws s3 cp aws-deploy/package/iqnexus-freetier.tar.gz s3://YOUR_ARTIFACT_BUCKET/
ssh ec2-user@EC2_HOST 'cd /opt/iqnexus && ARTIFACT_BUCKET=... AWS_REGION=eu-north-1 bash deploy-remote.sh'
```

### First-time infra (new EC2 only)

```bash
export AWS_REGION=eu-north-1
export AWS_APP_REGION=eu-north-1
export AWS_BUCKET_NAME=epocho-1.2
export AWS_KEY=...   # optional bootstrap only
export AWS_SECRET=...
bash aws-deploy/deploy.sh
```

---

## Project layout

```
iqnexus/
├── docker-compose.yml              # LOCAL
├── .env.example                    # LOCAL AWS template
├── iqnexus-backend-main/
├── iqnexus-client-main/
├── iqnexus-admin-main/
├── aws-deploy/
│   ├── package.sh                  # Prod build
│   ├── deploy-remote.sh            # Prod update on existing EC2
│   ├── deploy.sh                   # CloudFormation bootstrap
│   ├── docker-compose.freetier.yml # PROD
│   └── nginx/freetier.conf
└── .github/workflows/
```

See [aws-deploy/README.md](aws-deploy/README.md) for AWS details.
