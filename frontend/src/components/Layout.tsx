import { Outlet, Link } from 'react-router-dom'

export default function Layout() {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Navbar */}
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <Link to="/" className="flex items-center text-xl font-bold text-blue-600">
                                URL Shortener
                            </Link>
                            <div className="hidden sm:ml-8 sm:flex sm:space-x-6">
                                <Link
                                    to="/about"
                                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-gray-900"
                                >
                                    About
                                </Link>
                                <Link
                                    to="/dashboard"
                                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-gray-900"
                                >
                                    Dashboard
                                </Link>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link
                                to="/login"
                                className="text-sm font-medium text-gray-700 hover:text-gray-900"
                            >
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                                Register
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Outlet />
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-gray-50 border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-500">
                            © 2026 URL Shortener. All rights reserved.
                        </p>
                        <div className="flex space-x-6">
                            <Link to="/about" className="text-sm text-gray-500 hover:text-gray-900">
                                About
                            </Link>
                            <a href="/api/docs" className="text-sm text-gray-500 hover:text-gray-900">
                                API Docs
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
