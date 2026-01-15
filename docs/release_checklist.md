# Release Checklist

Checklist pre-deploy para DD Shortener.

## 🔒 Seguridad

- [ ] `SECRET_KEY` generada y configurada (mín. 32 caracteres)
  ```powershell
  python -c "import secrets; print(secrets.token_urlsafe(64))"
  ```
- [ ] `ENVIRONMENT=production` en variables de entorno
- [ ] HTTPS habilitado (Cloudflare/Nginx)
- [ ] Headers de seguridad verificados (CSP, X-Frame-Options, etc.)

## 🗄️ Base de Datos

- [ ] Backup reciente de PostgreSQL
  ```powershell
  docker compose exec -T db pg_dump -U shortener_user shortener > backup_$(Get-Date -Format "yyyyMMdd").sql
  ```
- [ ] Migraciones aplicadas (si hay nuevas)
- [ ] Conexión DB verificada

## 📦 Build & Deploy

- [ ] `docker compose build --no-cache` ejecutado
- [ ] Imágenes nuevas tagueadas si aplica
- [ ] `verify.ps1` pasando todos los tests
  ```powershell
  powershell -ExecutionPolicy Bypass -File .\verify.ps1
  ```

## 🌐 Cloudflare / DNS

- [ ] DNS apuntando al servidor correcto
- [ ] SSL/TLS en modo Full (strict)
- [ ] Cache rules configuradas para assets estáticos
- [ ] Rate limiting activo

## 💾 Servidor

- [ ] Espacio en disco > 1GB libre
  ```powershell
  docker system df
  ```
- [ ] Logs rotados (max-size: 10m, max-file: 3)
- [ ] Contenedores healthy
  ```powershell
  docker compose ps
  ```

## ✅ Smoke Tests Post-Deploy

1. `GET /api/health` → 200
2. `GET /app/` → Landing carga
3. Crear usuario → Login funciona
4. Crear URL → Redirect funciona
5. `GET /app/support` → Donations.json carga

## 📋 Rollback

Si algo falla:
```powershell
# Restaurar backup
docker compose exec -T db psql -U shortener_user -d shortener < backup_YYYYMMDD.sql

# Volver a imagen anterior
docker compose down
docker compose up -d
```
