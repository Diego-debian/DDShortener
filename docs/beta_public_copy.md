# DD Shortener (Beta) — Public Copy & Rules (Source of Truth)

**Estado**: Beta pública (Enero 2026)  
**Autor**: DiegoDebian  
**Contacto (beta, temporal)**: b2english.app@gmail.com  
**Licencia**: GPLv3 (monetización por la experiencia del servicio; el código permanece abierto)

---

## 1) Reglas del proyecto (No negociables)

### Backend y arquitectura
- **Backend**: CERRADO / ESTABLE. No se agregan endpoints, no se cambian campos, no se hacen migraciones.
- **Infra / routing**: No se cambia Nginx ni el enrutamiento /app, /api, /{short_code}.
- **Frontend (rutas existentes)**: NO modificar lógica ni UI de:
  - /app/login
  - /app/register
  - /app/dashboard
  - /app/go/:short_code
  - /app/stats/:short_code

### Monetización y anuncios
- **Free**: usa hold page con video promocional.
- **Premium (futuro)**: experiencia sin anuncios y menor espera. (No se promete fecha; es roadmap.)
- **Autopromoción**: se permite SOLO en la hold page del plan Free (promotions.json), durante la beta.

### Fuente de verdad
- Este documento es la **fuente de verdad** del texto para /app (landing) y /app/about.
- Si la UI difiere de este documento, la UI está incorrecta.

---

## 2) Copy: Landing — /app

**Título**
DD Shortener (Beta)

**Subtítulo**
by DiegoDebian

**Descripción**
Un acortador de enlaces experimental con una página intermedia antes del redireccionamiento.  
Este proyecto está en fase de prueba pública y se está validando con usuarios reales.

**Qué puedes hacer hoy**
- Crear enlaces cortos
- Compartirlos mediante /app/go/{short_code}
- Página intermedia antes del redirect
- Estadísticas públicas por enlace
- Proyecto open source (GPLv3)

**Transparencia**
En el plan gratuito se muestra un video antes del redireccionamiento.  
Esto permite cubrir costos del servidor durante la fase beta.  
El plan Premium no mostrará anuncios.

**Qué viene después (sin fechas)**
- Plan Premium sin anuncios
- Menor tiempo de espera
- Más control para usuarios frecuentes
- Campañas promocionales (solo en Free)  
El orden dependerá del uso real y el feedback.

**Apoya el proyecto**
DD Shortener es software libre.  
Si te resulta útil, puedes apoyar su desarrollo y los costos del servidor con una donación voluntaria.  
Botones (placeholder): “Donar (próximamente)” y “Donar (próximamente)”.

**Contacto**
b2english.app@gmail.com  
Correo temporal durante la fase beta.

---

## 3) Copy: About — /app/about

**¿Qué es DD Shortener?**
DD Shortener es un proyecto personal desarrollado por DiegoDebian.  
Explora el uso de páginas intermedias antes del redireccionamiento como experimento técnico y de producto.

**Estado del proyecto**
🚧 Beta pública  
El proyecto está en pruebas con usuarios reales. Algunas decisiones pueden cambiar.

**Cómo funciona**
- Creas un enlace corto
- El enlace pasa por una página intermedia
- Luego se redirige al destino final

**Free vs Premium**
- Free: muestra un video antes del redirect
- Premium: experiencia sin anuncios y menor espera

**Monetización y GPLv3**
El código del proyecto es open source bajo GPLv3.  
La monetización se basa en la experiencia del servicio, no en cerrar el código.

**Privacidad**
- No se utilizan cookies de seguimiento
- Los videos se cargan desde youtube-nocookie.com

**Contacto y apoyo**
b2english.app@gmail.com  
Correo temporal durante la fase beta.  
Donaciones voluntarias disponibles próximamente.
