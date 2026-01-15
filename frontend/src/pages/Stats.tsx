import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch, ApiError } from '../lib/apiFetch';
import Toast, { type ToastProps } from '../components/Toast';

interface ByDateEntry {
    date: string;
    clicks: number;
}

interface StatsResponse {
    url: {
        id: number;
        short_code: string;
        long_url: string;
        created_at: string;
        expires_at: string | null;
        is_active: boolean;
    };
    total_clicks: number;
    by_date: ByDateEntry[];
}

export default function Stats() {
    const { short_code } = useParams<{ short_code: string }>();
    const [stats, setStats] = useState<StatsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [errorType, setErrorType] = useState<'not_found' | 'expired' | 'invalid' | 'other'>('other');
    const [toast, setToast] = useState<Omit<ToastProps, 'onClose'> | null>(null);

    useEffect(() => {
        if (short_code) {
            fetchStats();
        }
    }, [short_code]);

    const fetchStats = async () => {
        setLoading(true);
        setError('');

        try {
            const data = await apiFetch<StatsResponse>(`/api/urls/${short_code}/stats`);
            setStats(data);
        } catch (err) {
            if (err instanceof ApiError) {
                if (err.status === 404) {
                    setErrorType('not_found');
                    setError('URL not found or inactive');
                } else if (err.status === 410) {
                    setErrorType('expired');
                    setError('URL expired or limit reached');
                } else if (err.status === 422) {
                    setErrorType('invalid');
                    setError('Invalid short code format');
                } else if (err.status === 503) {
                    setError('Service experiencing high demand. Please try again in a moment.');
                } else {
                    setError(err.message || 'Failed to load statistics');
                }
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Estadísticas de URL</h1>
                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-gray-500">Cargando estadísticas...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Estadísticas de URL</h1>

                <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-red-900 mb-2">
                        {errorType === 'not_found' && '❌ No Encontrado'}
                        {errorType === 'expired' && '⏰ Expirado'}
                        {errorType === 'invalid' && '⚠️ Código Inválido'}
                        {errorType === 'other' && '❌ Error'}
                    </h3>
                    <p className="text-red-700">{error}</p>
                </div>

                <div className="flex gap-4">
                    <Link
                        to="/dashboard"
                        className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                    >
                        ← Volver al Dashboard
                    </Link>
                    <button
                        onClick={fetchStats}
                        className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    if (!stats) {
        return null;
    }

    // Sort by_date entries by date
    const sortedByDate = stats.by_date && Array.isArray(stats.by_date)
        ? [...stats.by_date].sort((a, b) => a.date.localeCompare(b.date))
        : [];
    const maxClicks = sortedByDate.length > 0 ? Math.max(...sortedByDate.map(d => d.clicks)) : 0;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Estadísticas de URL</h1>
                <Link
                    to="/dashboard"
                    className="text-blue-600 hover:text-blue-700"
                >
                    ← Volver al Dashboard
                </Link>
            </div>

            {/* Short Code Info */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Código Corto</label>
                    <p className="text-2xl font-mono font-bold text-blue-600">{stats.url.short_code}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL Destino</label>
                    <p className="text-gray-900 break-all">{stats.url.long_url}</p>
                </div>
            </div>

            {/* Total Clicks Card */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow p-6 mb-6 text-white">
                <h2 className="text-lg font-semibold mb-2">Clics Totales</h2>
                <p className="text-5xl font-bold">{stats.total_clicks}</p>
                <p className="text-blue-100 mt-2">Todos los clics en esta URL corta</p>
            </div>

            {/* Clicks by Date */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Clics por Fecha</h2>

                {!stats.by_date || !Array.isArray(stats.by_date) ? (
                    <p className="text-gray-500">Sin datos disponibles.</p>
                ) : sortedByDate.length === 0 ? (
                    <p className="text-gray-500">Aún no hay clics.</p>
                ) : (
                    <div className="space-y-2">
                        {sortedByDate.map((entry) => (
                            <div key={entry.date} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                <span className="text-gray-700">{entry.date}</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-32 bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full"
                                            style={{
                                                width: `${maxClicks > 0 ? (entry.clicks / maxClicks) * 100 : 0}%`
                                            }}
                                        />
                                    </div>
                                    <span className="text-gray-900 font-semibold w-12 text-right">
                                        {entry.clicks}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="mt-6 flex gap-4">
                <button
                    onClick={() => {
                        const shortUrl = `${window.location.origin}/app/go/${stats.url.short_code}`;
                        navigator.clipboard.writeText(shortUrl).then(() => {
                            setToast({ message: 'Link copied!', type: 'success' });
                        }).catch(() => {
                            setToast({ message: 'Failed to copy. Please copy manually.', type: 'error' });
                        });
                    }}
                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                    Copiar Link
                </button>
                <button
                    onClick={() => {
                        window.open(`${window.location.origin}/app/go/${stats.url.short_code}`, '_blank', 'noopener,noreferrer');
                    }}
                    className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
                >
                    Abrir Link
                </button>
            </div>

            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
