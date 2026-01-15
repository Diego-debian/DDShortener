import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface DonationMethod {
    name: string;
    description: string;
    url: string;
    suggested_amount?: string;
    primary?: boolean;
    icon?: string;
}

interface ActivationInstructions {
    title: string;
    subtitle?: string;
    steps: string[];
}

interface DonationsConfig {
    title: string;
    subtitle: string;
    methods: DonationMethod[];
    disclaimer: string;
    activation_instructions: ActivationInstructions;
}

export default function Support() {
    const [config, setConfig] = useState<DonationsConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const response = await fetch('/app-config/donations.json');
                if (!response.ok) {
                    throw new Error('Failed to load donation config');
                }
                const data = await response.json();
                setConfig(data);
            } catch (err) {
                console.warn('Could not load donations.json:', err);
                setError('No se pudo cargar la configuración de donaciones.');
            } finally {
                setLoading(false);
            }
        };
        loadConfig();
    }, []);

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto py-8">
                <div className="text-center text-gray-500">Cargando...</div>
            </div>
        );
    }

    if (error || !config) {
        return (
            <div className="max-w-2xl mx-auto py-8">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error || 'Error al cargar configuración'}
                </div>
                <Link to="/dashboard" className="text-blue-600 hover:underline mt-4 inline-block">
                    ← Volver al Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-8">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{config.title}</h1>
                <p className="text-gray-600">{config.subtitle}</p>
            </div>

            {/* Donation Methods */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Métodos de Donación</h2>
                <div className="space-y-3">
                    {config.methods.map((method, index) => (
                        <a
                            key={index}
                            href={method.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`block rounded-lg p-4 transition-colors ${method.primary
                                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                                : 'bg-gray-50 border border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                                }`}
                        >
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    {method.icon && (
                                        <span className="text-2xl">{method.icon}</span>
                                    )}
                                    <div>
                                        <h3 className={`font-semibold ${method.primary ? 'text-white' : 'text-gray-900'}`}>
                                            {method.name}
                                            {method.primary && <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded">Recomendado</span>}
                                        </h3>
                                        <p className={`text-sm ${method.primary ? 'text-blue-100' : 'text-gray-600'}`}>
                                            {method.description}
                                        </p>
                                    </div>
                                </div>
                                {method.suggested_amount && (
                                    <span className={`text-sm px-2 py-1 rounded ${method.primary
                                        ? 'bg-white/20 text-white'
                                        : 'bg-green-100 text-green-700'
                                        }`}>
                                        {method.suggested_amount}
                                    </span>
                                )}
                            </div>
                        </a>
                    ))}
                </div>
            </div>

            {/* Activation Instructions */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-purple-900 mb-2">
                    {config.activation_instructions.title}
                </h2>
                {config.activation_instructions.subtitle && (
                    <p className="text-purple-700 text-sm mb-4">
                        {config.activation_instructions.subtitle}
                    </p>
                )}
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    {config.activation_instructions.steps.map((step, index) => (
                        <li key={index}>{step}</li>
                    ))}
                </ol>
            </div>

            {/* Disclaimer */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600">
                    <span className="font-medium">ℹ️ Nota:</span> {config.disclaimer}
                </p>
            </div>

            {/* Premium Benefits */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Beneficios Premium</h2>
                <ul className="space-y-2">
                    <li className="flex items-center text-gray-700">
                        <span className="text-green-500 mr-2">✓</span>
                        Hasta 100 URLs activas (vs 3 del plan gratuito)
                    </li>
                    <li className="flex items-center text-gray-700">
                        <span className="text-green-500 mr-2">✓</span>
                        Página de espera reducida (próximamente)
                    </li>
                    <li className="flex items-center text-gray-700">
                        <span className="text-green-500 mr-2">✓</span>
                        Apoyas el desarrollo del proyecto
                    </li>
                </ul>
            </div>

            {/* Back Link */}
            <div className="text-center">
                <Link to="/dashboard" className="text-blue-600 hover:underline">
                    ← Volver al Dashboard
                </Link>
            </div>
        </div>
    );
}
