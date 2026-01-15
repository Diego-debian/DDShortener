import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, ApiError } from '../lib/apiFetch';
import { clearToken } from '../lib/auth';

interface UserData {
    id: number;
    email: string;
    is_active: boolean;
    plan: string;
    created_at: string;
}

export default function Me() {
    const navigate = useNavigate();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const data = await apiFetch<UserData>('/api/me');
            setUserData(data);
        } catch (err) {
            if (err instanceof ApiError) {
                if (err.status === 401) {
                    // Session expired or invalid token
                    clearToken();
                    navigate('/login', { replace: true });
                } else {
                    setError(err.message);
                }
            } else {
                setError('Failed to load user data. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        clearToken();
        navigate('/login', { replace: true });
    };

    if (loading) {
        return (
            <div className="max-w-3xl">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Mi Perfil</h1>
                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-gray-500">Cargando...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-3xl">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Mi Perfil</h1>
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                    {error}
                </div>
            </div>
        );
    }

    if (!userData) {
        return null;
    }

    return (
        <div className="max-w-3xl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
                <button
                    onClick={handleLogout}
                    className="px-4 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-50"
                >
                    Cerrar Sesión
                </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Información de Cuenta</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            ID de Usuario
                        </label>
                        <p className="text-gray-900">{userData.id}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Correo Electrónico
                        </label>
                        <p className="text-gray-900">{userData.email}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Estado de Cuenta
                        </label>
                        <p className="text-gray-900">
                            {userData.is_active ? (
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Plan
                        </label>
                        <p className="text-gray-900 capitalize">{userData.plan}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Miembro Desde
                        </label>
                        <p className="text-gray-900">
                            {new Date(userData.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Estadísticas de Uso</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">URLs Creadas</p>
                        <p className="text-2xl font-bold text-gray-900">--</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Clics Totales</p>
                        <p className="text-2xl font-bold text-gray-900">--</p>
                    </div>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                    Integración completa de estadísticas próximamente.
                </p>
            </div>
        </div>
    );
}
