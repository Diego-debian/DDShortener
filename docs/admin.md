# Admin Endpoints

Endpoints protegidos para administración. Requieren JWT + `plan == 'admin'`.

## 🔐 Autenticación

Todos los endpoints requieren header:
```
Authorization: Bearer <admin_token>
```

Si el usuario no es admin → **403 Forbidden**.

---

## Endpoints

### PATCH `/api/admin/users/{email}/plan`

Actualiza el plan de un usuario.

**Body:**
```json
{"plan": "free|premium|admin"}
```

**Respuestas:**
- `200` → Usuario actualizado
- `404` → Usuario no encontrado
- `422` → Payload inválido

**Ejemplo PowerShell:**
```powershell
$headers = @{ Authorization = "Bearer $ADMIN_TOKEN" }
$body = '{"plan": "premium"}'
Invoke-RestMethod -Uri "http://localhost/api/admin/users/user@example.com/plan" `
  -Method PATCH -Headers $headers -ContentType "application/json" -Body $body
```

---

### PATCH `/api/admin/urls/{short_code}`

Activa o desactiva una URL.

**Body:**
```json
{"is_active": true|false}
```

**Respuestas:**
- `200` → URL actualizada
- `404` → URL no encontrada
- `422` → Payload inválido

**Ejemplo PowerShell:**
```powershell
$body = '{"is_active": false}'
Invoke-RestMethod -Uri "http://localhost/api/admin/urls/abc123" `
  -Method PATCH -Headers $headers -ContentType "application/json" -Body $body
```

---

### GET `/api/admin/stats/top-urls`

Retorna las URLs más clickeadas.

**Query params:**
- `limit` (1-100, default 20)

**Ejemplo:**
```powershell
Invoke-RestMethod -Uri "http://localhost/api/admin/stats/top-urls?limit=10" -Headers $headers
```

---

## 🚀 Bootstrapping Primer Admin

Para crear el primer admin, usa SQL directo:

```powershell
# 1. Registrar usuario normal via UI o API
# 2. Promover a admin via SQL
docker compose exec -T db psql -U shortener_user -d shortener -c "UPDATE users SET plan = 'admin' WHERE email = 'admin@example.com';"
```

**Verificar:**
```powershell
# Login y verificar plan
$token = (Invoke-RestMethod -Uri "http://localhost/api/auth/login-json" `
  -Method POST -ContentType "application/json" `
  -Body '{"email":"admin@example.com","password":"..."}').access_token

(Invoke-RestMethod -Uri "http://localhost/api/me" `
  -Headers @{Authorization="Bearer $token"}).plan
# Debe retornar: "admin"
```
