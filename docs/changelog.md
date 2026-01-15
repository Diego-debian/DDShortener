# Changelog

## Enero 2026 - Beta Pública

### Fase 7: Release Pack
- README.md actualizado con Quick Start y tabla de planes
- Documentación completa: admin.md, support.md, release_checklist.md
- Changelog iniciado

### Fase 6: Payment Flow & UX
- PayPal como método de donación primario
- Ko-fi como alternativa secundaria
- Landing page (Home.tsx) con comparación Free vs Premium
- Copy unificado en todas las páginas
- Estilo visual consistente (sin gradientes excesivos)

### Fase 5: Admin Tools
- Endpoints admin protegidos (`/api/admin/*`)
- Dependency `require_admin` para autorización
- PATCH `/api/admin/users/{email}/plan`
- PATCH `/api/admin/urls/{code}`
- GET `/api/admin/stats/top-urls`
- Tests 14-16 en verify.ps1

### Fase 4: VM Ops
- Logging limits en Docker (10m × 3 files)
- Operations runbook (ops_runbook.md)
- Scripts de mantenimiento DB (PowerShell + SQL)
- Tests 12-13 en verify.ps1

### Fase 3: Security Hardening
- SECRET_KEY guardrail (abort en producción si inseguro)
- Schema hardening con `extra='forbid'`
- Rate limiting en Nginx para `/api/*`
- Production security checklist

### Fase 2: Premium Features
- Plan free/premium en users.plan
- Hold time diferenciado (10s free, 3s premium)
- Límite de URLs por plan (3 free, 100 premium)

### Fase 1: Core MVP
- Acortador de URLs funcional
- Autenticación JWT
- Página de espera (hold page) con video
- Dashboard y estadísticas
- Frontend React + Backend FastAPI + PostgreSQL
