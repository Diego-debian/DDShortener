import { Link } from 'react-router-dom';

export default function Home() {
    return (
        <div className="max-w-3xl mx-auto space-y-8 py-8 px-4">
            {/* Hero */}
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold text-gray-900">DD Shortener</h1>
                <p className="text-lg text-gray-600">Acorta tus enlaces. Simple y transparente.</p>
            </div>

            {/* Primary CTAs */}
            <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Link
                    to="register"
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-center shadow-md"
                >
                    Crear cuenta gratis
                </Link>
                <Link
                    to="login"
                    className="bg-white text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors border border-gray-300 text-center"
                >
                    Iniciar sesión
                </Link>
            </div>

            {/* What is DDShortener */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
                <h2 className="text-xl font-semibold mb-3 text-gray-900">¿Qué es DD Shortener?</h2>
                <p className="text-gray-600">
                    Un acortador de enlaces con página intermedia que muestra contenido del creador.
                    <br />
                    <span className="text-sm text-gray-500">Proyecto open source (GPLv3) en fase beta pública.</span>
                </p>
            </div>

            {/* Free vs Premium */}
            <div className="grid md:grid-cols-2 gap-4">
                {/* Free Plan */}
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">🆓 Plan Gratuito</h3>
                    <ul className="space-y-2 text-gray-600 text-sm">
                        <li className="flex items-start gap-2">
                            <span className="text-gray-400">•</span>
                            <span>Hasta 3 URLs activas</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-gray-400">•</span>
                            <span>Página de espera con video (10 seg)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-gray-400">•</span>
                            <span>Estadísticas por enlace</span>
                        </li>
                    </ul>
                </div>

                {/* Premium Plan */}
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-lg border border-purple-200">
                    <h3 className="text-lg font-semibold text-purple-900 mb-3">⭐ Plan Premium</h3>
                    <ul className="space-y-2 text-gray-700 text-sm">
                        <li className="flex items-start gap-2">
                            <span className="text-purple-500">✓</span>
                            <span>Hasta 100 URLs activas</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-purple-500">✓</span>
                            <span>Espera reducida (3 seg)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-purple-500">✓</span>
                            <span>Apoyas el proyecto</span>
                        </li>
                    </ul>
                    <p className="text-xs text-purple-600 mt-3">Obtén Premium con una donación voluntaria</p>
                </div>
            </div>

            {/* Support CTA */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200 text-center">
                <h2 className="text-xl font-semibold mb-2 text-gray-900">💜 Apoya el ecosistema DiegoDebian</h2>
                <p className="text-gray-600 text-sm mb-4">
                    Tu apoyo mantiene mis proyectos online. PayPal es el método recomendado.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <a
                        href="https://www.paypal.com/donate/?business=profediegoparra01@gmail.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
                    >
                        💳 Donar por PayPal
                    </a>
                    <Link
                        to="support"
                        className="bg-purple-100 text-purple-700 px-6 py-2 rounded-lg hover:bg-purple-200 transition-colors"
                    >
                        Más opciones →
                    </Link>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                    Activación Premium manual por correo (por ahora)
                </p>
            </div>

            {/* Contact */}
            <div className="text-center text-gray-500 text-sm">
                <p>
                    Contacto: <a href="mailto:b2english.app@gmail.com" className="text-blue-600 hover:underline">b2english.app@gmail.com</a>
                </p>
                <p className="mt-1 text-xs">Proyecto by DiegoDebian • Beta pública</p>
            </div>
        </div>
    );
}

