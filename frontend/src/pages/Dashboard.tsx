export default function Dashboard() {
    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

            <div className="grid gap-6 md:grid-cols-3 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-sm font-medium text-gray-500">Total URLs</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">--</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-sm font-medium text-gray-500">Total Clicks</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">--</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-sm font-medium text-gray-500">Active Links</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">--</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Your URLs</h2>
                </div>
                <div className="p-6">
                    <p className="text-gray-500 text-center py-12">
                        No URLs created yet. This dashboard will display your shortened URLs and their statistics.
                    </p>
                </div>
            </div>
        </div>
    )
}
