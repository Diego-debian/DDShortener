export default function About() {
    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">¿Qué es DD Shortener?</h1>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-6">
                {/* Intro */}
                <div>
                    <p className="text-gray-700 mb-2">
                        DD Shortener es un proyecto personal desarrollado por DiegoDebian.
                    </p>
                    <p className="text-gray-700">
                        Explora el uso de páginas intermedias antes del redireccionamiento como experimento técnico y de producto.
                    </p>
                </div>

                {/* Status */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Estado del proyecto</h2>
                    <p className="text-gray-700">
                        🚧 Beta pública
                        <br />
                        El proyecto está en pruebas con usuarios reales. Algunas decisiones pueden cambiar.
                    </p>
                </div>

                {/* How it works */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Cómo funciona</h2>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                        <li>Creas un enlace corto</li>
                        <li>El enlace pasa por una página intermedia</li>
                        <li>Luego se redirige al destino final</li>
                    </ul>
                </div>

                {/* Free vs Premium */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Free vs Premium</h2>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                        <li><strong>Free:</strong> muestra un video antes del redirect</li>
                        <li><strong>Premium:</strong> experiencia sin anuncios y menor espera</li>
                    </ul>
                </div>

                {/* Monetization & GPL */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Monetización y GPLv3</h2>
                    <p className="text-gray-700 mb-2">
                        El código del proyecto es open source bajo GPLv3.
                    </p>
                    <p className="text-gray-700">
                        La monetización se basa en la experiencia del servicio, no en cerrar el código.
                    </p>
                </div>

                {/* Privacy */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Privacidad</h2>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                        <li>No se utilizan cookies de seguimiento</li>
                        <li>Los videos se cargan desde youtube-nocookie.com</li>
                    </ul>
                </div>

                {/* Contact */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Contacto y apoyo</h2>
                    <p className="text-gray-700">
                        <a href="mailto:b2english.app@gmail.com" className="text-blue-600 hover:underline">b2english.app@gmail.com</a>
                        <br />
                        Correo temporal durante la fase beta.
                        <br />
                        Donaciones voluntarias disponibles próximamente.
                    </p>
                </div>
            </div>
        </div>
    )
}
