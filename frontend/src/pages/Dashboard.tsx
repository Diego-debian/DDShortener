import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, ApiError } from '../lib/apiFetch';
import { clearToken } from '../lib/auth';
import { addToHistory, getHistory, removeFromHistory, type URLHistoryItem } from '../lib/urlHistory';
import Toast, { type ToastProps } from '../components/Toast';

interface CreateURLResponse {
    short_code: string;
    long_url: string;
    created_at: string;
    expires_at: string | null;
    is_active: boolean;
}

export default function Dashboard() {
    const navigate = useNavigate();
    const [longUrl, setLongUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [validationError, setValidationError] = useState('');
    const [createdUrl, setCreatedUrl] = useState<CreateURLResponse | null>(null);
    const [history, setHistory] = useState<URLHistoryItem[]>(getHistory());
    const [toast, setToast] = useState<Omit<ToastProps, 'onClose'> | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setValidationError('');
        setCreatedUrl(null);
        setLoading(true);

        try {
            const response = await apiFetch<CreateURLResponse>('/api/urls', {
                method: 'POST',
                body: JSON.stringify({ long_url: longUrl }),
            });

            // Show result
            setCreatedUrl(response);

            // Add to local history
            const historyItem: URLHistoryItem = {
                short_code: response.short_code,
                long_url: response.long_url,
                created_at: response.created_at,
                expires_at: response.expires_at,
                is_active: response.is_active,
            };
            addToHistory(historyItem);
            setHistory(getHistory());

            // Clear form
            setLongUrl('');
        } catch (err) {
            if (err instanceof ApiError) {
                if (err.status === 401) {
                    // Session expired
                    clearToken();
                    navigate('/login', { replace: true });
                } else if (err.status === 403) {
                    // Free plan limit - show exact detail
                    setError(err.message);
                } else if (err.status === 422) {
                    // Validation error
                    setValidationError(err.message);
                } else if (err.status === 503) {
                    // Service unavailable (HTML response)
                    setError('Service experiencing high demand. Please try again in a moment.');
                } else {
                    setError(err.message);
                }
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                setToast({ message: 'Link copied to clipboard!', type: 'success' });
            }).catch(() => {
                setToast({ message: 'Failed to copy. Please copy manually.', type: 'error' });
            });
        } else {
            setToast({ message: 'Copy not supported. Please copy manually.', type: 'error' });
        }
    };

    const openInNewTab = (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleRemoveFromHistory = (short_code: string) => {
        removeFromHistory(short_code);
        setHistory(getHistory());
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

            {/* URL Creation Form */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Crear URL Corta</h2>

                {error && (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="longUrl" className="block text-sm font-medium text-gray-700 mb-1">
                            URL Larga
                        </label>
                        <input
                            type="url"
                            id="longUrl"
                            value={longUrl}
                            onChange={(e) => setLongUrl(e.target.value)}
                            placeholder="https://example.com/very/long/url"
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${validationError ? 'border-red-500' : 'border-gray-300'
                                }`}
                            required
                            disabled={loading}
                        />
                        {validationError && (
                            <p className="text-red-600 text-sm mt-1">{validationError}</p>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        {loading ? 'Creando...' : 'Crear URL Corta'}
                    </button>
                </form>
            </div>

            {/* Result Card */}
            {createdUrl && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-green-900 mb-4">✓ ¡URL Creada!</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Código Corto</label>
                            <p className="text-gray-900 font-mono">{createdUrl.short_code}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Enlace para Compartir</label>
                            <p className="text-blue-600 font-mono break-all">
                                {`${window.location.origin}/app/go/${createdUrl.short_code}`}
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">URL Original</label>
                            <p className="text-gray-600 break-all">{createdUrl.long_url}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Creada</label>
                                <p className="text-gray-900">{new Date(createdUrl.created_at).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                <p className="text-gray-900">
                                    {createdUrl.is_active ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Activo
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            Inactivo
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={() => copyToClipboard(`${window.location.origin}/app/go/${createdUrl.short_code}`)}
                                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                            >
                                Copiar
                            </button>
                            <button
                                onClick={() => openInNewTab(`/app/go/${createdUrl.short_code}`)}
                                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
                            >
                                Abrir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* History List */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">URLs Recientes</h2>
                {history.length === 0 ? (
                    <p className="text-gray-500">Aún no has creado URLs. ¡Crea tu primera URL corta arriba!</p>
                ) : (
                    <div className="space-y-3">
                        {history.map((item) => (
                            <div key={item.short_code} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <p className="font-mono text-blue-600 font-semibold">{item.short_code}</p>
                                        <p className="text-sm text-gray-600 break-all">{item.long_url}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Creada: {new Date(item.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={() => copyToClipboard(`${window.location.origin}/app/go/${item.short_code}`)}
                                        className="text-sm bg-blue-100 text-blue-700 py-1 px-3 rounded hover:bg-blue-200"
                                    >
                                        Copiar
                                    </button>
                                    <button
                                        onClick={() => openInNewTab(`/app/go/${item.short_code}`)}
                                        className="text-sm bg-gray-100 text-gray-700 py-1 px-3 rounded hover:bg-gray-200"
                                    >
                                        Abrir
                                    </button>
                                    <button
                                        onClick={() => navigate(`/stats/${item.short_code}`)}
                                        className="text-sm bg-indigo-100 text-indigo-700 py-1 px-3 rounded hover:bg-indigo-200"
                                    >
                                        Estadísticas
                                    </button>
                                    <button
                                        onClick={() => handleRemoveFromHistory(item.short_code)}
                                        className="text-sm bg-red-100 text-red-700 py-1 px-3 rounded hover:bg-red-200"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Support CTA */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-6">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h3 className="font-semibold text-purple-900">💜 Apoya el ecosistema</h3>
                        <p className="text-sm text-purple-700">Quita la espera y obtén más URLs</p>
                    </div>
                    <button
                        onClick={() => navigate('/support')}
                        className="bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 text-sm whitespace-nowrap"
                    >
                        Ver opciones →
                    </button>
                </div>
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
