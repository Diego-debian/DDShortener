# DD Shortener

Un acortador de URLs con página intermedia. Proyecto open source (GPLv3) en **beta pública**.

## 🚀 Quick Start

```bash
# Clonar y ejecutar
git clone <repo-url>
cd repo
docker compose up -d --build

# Verificar
./verify.ps1  # Windows/PowerShell
```

**URLs locales:**
- Frontend: `http://localhost/app/`
- API: `http://localhost/api/health`
- Redirección: `http://localhost/{short_code}`

## 📋 Rutas Principales

| Ruta | Descripción |
| :--- | :--- |
| `/app/` | Landing pública (sin login) |
| `/app/dashboard` | Dashboard de usuario |
| `/app/support` | Opciones de donación |
| `/app/go/{code}` | Página de espera antes de redirect |
| `/api/*` | Endpoints API (auth, urls, stats) |
| `/{short_code}` | Redirección directa al destino |

## 💳 Planes

| Característica | 🆓 Free | ⭐ Premium |
| :--- | :--- | :--- |
| URLs activas | 3 | 100 |
| Tiempo de espera | 10 segundos | 3 segundos |
| Video promocional | Sí | No |

## 💜 Apoya el Proyecto

DD Shortener es software libre. Si te resulta útil, considera apoyarlo:

**PayPal (recomendado):**
```
https://www.paypal.com/donate/?business=profediegoparra01@gmail.com
```

**Ko-fi (alternativa):**
```
https://ko-fi.com/diegodebian
```

**Activación Premium:**
Envía un correo a `b2english.app@gmail.com` con:
- El email de tu cuenta DD Shortener
- Comprobante de donación

Activación manual en 24-48 horas.

## ⚠️ Nota Beta

> **Best-effort**: Este servicio está en beta pública. La persistencia de datos y el uptime no están garantizados al 100%. Las características pueden cambiar según feedback.

## 📁 Estructura del Proyecto

```
repo/
├── backend/          # FastAPI + PostgreSQL
├── frontend/         # React + Vite
├── nginx/            # Proxy inverso
├── app-config/       # Configuración dinámica (JSON)
├── docs/             # Documentación
├── scripts/          # Utilidades DB
└── docker-compose.yml
```

## 📚 Documentación

- [Admin Endpoints](docs/admin.md)
- [Release Checklist](docs/release_checklist.md)
- [Support & Donations](docs/support.md)
- [Production Security](docs/production_security_checklist.md)
- [Operations Runbook](docs/ops_runbook.md)

## 📧 Contacto

**b2english.app@gmail.com** — Correo temporal para beta.

## 📄 Licencia

**GPLv3** — Software libre. El código es abierto y transparente.
