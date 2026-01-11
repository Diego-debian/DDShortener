import { useParams, Link } from 'react-router-dom'

export default function Stats() {
    const { short_code } = useParams()

    return (
        <div>
            <div className="mb-6">
                <Link to="/dashboard" className="text-blue-600 hover:text-blue-700">
                    ← Back to Dashboard
                </Link>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">URL Statistics</h1>
            <code className="text-lg font-mono text-gray-600 mb-6 block">/{short_code}</code>

            <div className="grid gap-6 md:grid-cols-4 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-sm font-medium text-gray-500">Total Clicks</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">--</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-sm font-medium text-gray-500">Today</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">--</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-sm font-medium text-gray-500">This Week</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">--</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-sm font-medium text-gray-500">This Month</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">--</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Target URL</h2>
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <p className="text-sm text-gray-500 mb-1">Destination</p>
                    <p className="text-gray-900 font-mono break-all">
                        (Will display target URL from API)
                    </p>
                </div>
            </div>

            <div className="mt-8 bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
                <p className="text-gray-500 text-center py-8">
                    Click analytics will be displayed here once integrated with the backend API.
                </p>
            </div>
        </div>
    )
}
