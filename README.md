# DD Shortener (Beta) — Public Beta (Enero 2026)

Este proyecto es un acortador de URLs experimental con una página intermedia de espera para validación de producto.
Actualmente se encuentra en **Beta pública**.

## Estado del Proyecto
🚧 **Beta Pública**
El servicio opera en modo "best-effort". La persistencia de datos y el tiempo de actividad no están garantizados al 100% durante esta fase. Las características pueden cambiar según el feedback.

## Cómo funciona
1.  **Crear enlace**: Generas una URL corta desde el Dashboard.
2.  **Compartir**: Usas el enlace formato `/app/go/{short_code}`.
3.  **Redirección**: El usuario ve una página intermedia (Hold Page) antes de ser redirigido al destino final.

## Transparencia y Monetización
*   **Plan Free**: Muestra un video promocional en la página intermedia antes de la redirección. Esto ayuda a cubrir los costos del servidor durante la beta.
*   **Plan Premium (Roadmap)**: Ofrecerá una experiencia sin anuncios y con menor tiempo de espera. (Sin fecha definida).

### Autopromoción
Durante la beta, la autopromoción está permitida **exclusivamente** en la página de espera (hold page) del plan gratuito, configurada a través de `promotions.json`.

## Resumen de Rutas
*   **Frontend**: `/app/*` (Landing, Dashboard, Login, About)
*   **API**: `/api/*` (Endpoints del backend)
*   **Redirección**: `/{short_code}` (Ruta final gestionada por el backend)
*   **Configuración**: `/app-config/promotions.json` (Editable sin redeploy del frontend)

## Contacto (Beta)
📧 **b2english.app@gmail.com**
*Correo temporal para contacto y reporte de bugs durante la fase beta.*

## Apoya el proyecto
Las donaciones voluntarias estarán disponibles próximamente.

## Licencia
**GPLv3**.
Este proyecto es software libre. La monetización se basa en la experiencia del servicio ofrecido (tiempos de espera, anuncios), mientras que el código permanece abierto y transparente.
