# Documentation Index

## Overview

This directory contains comprehensive documentation for the URL Shortener project. Start here to find what you need.

---

## Getting Started

- **[Main README](../README.md)** - Project overview, quickstart, and architecture
- **[Frontend README](../frontend/README.md)** - Frontend development guide (React+Vite+TypeScript)

---

## Architecture & Design

- **[Architecture Overview](./architecture.md)** - System design, same-origin policy, and routing strategy
- **[Routing Architecture](./routing.md)** - Nginx routing, /app/go vs /{short_code} separation
- **[Screens](./screens.md)** - Frontend pages, features, and user flows

---

## API & Contracts

- **[API Documentation](./api.md)** - Complete backend API reference
- **[Frontend-Backend Contract](./api_contract_frontend.md)** - Frontend API usage and contracts
- **[Error Handling](./error_handling.md)** - HTTP status codes and UI error patterns

---

## Security

- **[Frontend Security](./security_frontend.md)** - Token storage, CSP, headers, validations, embed safety

---

## Operations & Deployment

- **[Runbook](./runbook.md)** - Daily operations, monitoring, and troubleshooting
- **[Deploy Guide (Nginx + Frontend)](./deploy_nginx_frontend.md)** - Deployment procedures and verification

---

## Features

- **[YouTube Promotions](./promotions_youtube.md)** - promotions.json configuration and video selection

---

## Quality Assurance

- **[QA Checklist](./qa_checklist.md)** - Manual testing checklist before releases
- **[Testing Guide](./testing.md)** - Automated testing strategies

---

## Database

- **[Project Analysis](./project_analysis.md)** - Database schema and design decisions
- **[DB Schema Snapshot](./db-schema-snapshot.md)** - Current database structure
- **[DB Mismatch Notes](./db-mismatch.md)** - Known schema inconsistencies (tech debt)
- **[Migrations](./migrations/)** - Database migration history

---

## Quick Links

### For Developers
1. Start: [Main README](../README.md)
2. Frontend: [Frontend README](../frontend/README.md)
3. Architecture: [Architecture Overview](./architecture.md)
4. API: [API Documentation](./api.md)

### For Operations
1. Deploy: [Deploy Guide](./deploy_nginx_frontend.md)
2. Monitor: [Runbook](./runbook.md)
3. Test: [QA Checklist](./qa_checklist.md)

### For Security Review
1. [Frontend Security](./security_frontend.md)
2. [Error Handling](./error_handling.md)
3. [Routing Architecture](./routing.md)
