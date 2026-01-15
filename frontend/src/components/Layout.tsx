import { Outlet, Link, useNavigate } from 'react-router-dom'
import { isAuthenticated, clearToken } from '../lib/auth'

export default function Layout() {
    const navigate = useNavigate();
    const authenticated = isAuthenticated();

    const handleLogout = () => {
        clearToken();
        navigate('/login', { replace: true });
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <header className="bg-slate-900 border-b border-slate-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-14">
                        <div className="flex items-center">
                            <Link to="/" className="text-lg font-semibold text-gray-100 hover:text-white">
                                DD Shortener
                            </Link>
                            <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
                                <Link
                                    to="/about"
                                    className="text-sm text-gray-300 hover:text-violet-400 transition-colors"
                                >
                                    Acerca de
                                </Link>
                                {authenticated && (
                                    <Link
                                        to="/dashboard"
                                        className="text-sm text-gray-300 hover:text-violet-400 transition-colors"
                                    >
                                        Dashboard
                                    </Link>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            {authenticated ? (
                                <>
                                    <Link
                                        to="/me"
                                        className="text-sm text-gray-300 hover:text-violet-400 transition-colors"
                                    >
                                        Mi Cuenta
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
                                    >
                                        Salir
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="text-sm text-gray-300 hover:text-violet-400 transition-colors"
                                    >
                                        Iniciar Sesión
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="text-sm px-3 py-1.5 rounded border border-violet-500 text-violet-400 hover:bg-violet-500/10 transition-colors"
                                    >
                                        Registrarse
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Outlet />
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-slate-950 border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                        <p className="text-xs text-gray-500">
                            Proyecto open source (GPLv3) • Beta pública
                        </p>
                        <div className="flex space-x-4">
                            <Link to="/support" className="text-xs text-gray-400 hover:text-violet-400 transition-colors">
                                Apoyar
                            </Link>
                            <Link to="/about" className="text-xs text-gray-400 hover:text-violet-400 transition-colors">
                                Acerca de
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
