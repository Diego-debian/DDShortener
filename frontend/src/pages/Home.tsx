import { Link } from 'react-router-dom';

export default function Home() {
    return (
        <div className="max-w-3xl mx-auto space-y-8 py-8">
            {/* Header */}
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold text-gray-900">DD Shortener (Beta)</h1>
                <p className="text-xl text-gray-600">by DiegoDebian</p>
                <div className="prose max-w-none text-gray-700">
                    <p>
                        Un acortador de enlaces experimental con una página intermedia antes del redireccionamiento.
                        <br />
                        Este proyecto está en fase de prueba pública y se está validando con usuarios reales.
                    </p>
                </div>
            </div>

            {/* CTAs */}
            <div className="flex justify-center gap-4">
                <Link
                    to="register"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Registrarme
                </Link>
                <Link
                    to="login"
                    className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                    Iniciar Sesión
                </Link>
            </div>

            {/* Main Content Grid */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Capabilities */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h2 className="text-xl font-semibold mb-3 text-gray-900">Qué puedes hacer hoy</h2>
                    <ul className="list-disc list-inside space-y-2 text-gray-600">
                        <li>Crear enlaces cortos</li>
                        <li>Compartirlos mediante <code className="text-sm bg-gray-100 px-1 rounded">/app/go/&#123;short_code&#125;</code></li>
                        <li>Página intermedia antes del redirect</li>
                        <li>Estadísticas públicas por enlace</li>
                        <li>Proyecto open source (GPLv3)</li>
                    </ul>
                </div>

                {/* Transparency */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h2 className="text-xl font-semibold mb-3 text-gray-900">Transparencia</h2>
                    <p className="text-gray-600 mb-2">
                        En el plan gratuito se muestra un video antes del redireccionamiento.
                    </p>
                    <p className="text-gray-600 mb-2">
                        Esto permite cubrir costos del servidor durante la fase beta.
                    </p>
                    <p className="text-gray-600">
                        El plan Premium no mostrará anuncios.
                    </p>
                </div>
            </div>

            {/* Roadmap */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h2 className="text-xl font-semibold mb-3 text-gray-900">Qué viene después (sin fechas)</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                    <li>Plan Premium sin anuncios</li>
                    <li>Menor tiempo de espera</li>
                    <li>Más control para usuarios frecuentes</li>
                    <li>Campañas promocionales (solo en Free)</li>
                </ul>
                <p className="text-sm text-gray-500 italic">El orden dependerá del uso real y el feedback.</p>
            </div>

            {/* Support */}
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 text-center">
                <h2 className="text-xl font-semibold mb-3 text-gray-900">Apoya el proyecto</h2>
                <p className="text-gray-700 mb-4">
                    DD Shortener es software libre.
                    <br />
                    Si te resulta útil, puedes apoyar su desarrollo y los costos del servidor con una donación voluntaria.
                </p>
                <div className="flex justify-center gap-4">
                    <a
                        href="https://www.paypal.com/donate/?business=profediegoparra01@gmail.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    >
                        Donar por PayPal
                    </a>
                    <button disabled className="bg-gray-300 text-gray-500 px-4 py-2 rounded cursor-not-allowed">
                        Donar (próximamente)
                    </button>
                </div>
            </div>

            {/* Contact */}
            <div className="text-center text-gray-600">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Contacto</h2>
                <a href="mailto:b2english.app@gmail.com" className="text-blue-600 hover:underline">b2english.app@gmail.com</a>
                <p className="text-sm mt-1">Correo temporal durante la fase beta.</p>
            </div>
        </div>
    );
}
