import { Link } from 'react-router-dom'

export default function Login() {
    return (
        <div className="max-w-md mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Login</h1>
            <div className="bg-white rounded-lg shadow p-8">
                <p className="text-gray-600 mb-6">
                    Sign in to your account to manage your shortened URLs.
                </p>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            placeholder="your@email.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled
                        />
                    </div>
                    <button
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                        disabled
                    >
                        Sign In (Placeholder)
                    </button>
                </div>
                <p className="mt-4 text-sm text-center text-gray-600">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-blue-600 hover:text-blue-700">
                        Register here
                    </Link>
                </p>
            </div>
        </div>
    )
}
