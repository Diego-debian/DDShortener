export default function About() {
    return (
        <div className="max-w-3xl">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">About URL Shortener</h1>
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
                <p className="text-gray-700">
                    This is a modern URL shortening service built with a FastAPI backend and React frontend.
                </p>
                <p className="text-gray-700">
                    <strong>Purpose:</strong> Transform long URLs into short, shareable links with analytics.
                </p>
                <div className="pt-4 border-t">
                    <h2 className="text-xl font-semibold mb-2">Features</h2>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                        <li>Create short URLs with custom codes</li>
                        <li>Track click statistics</li>
                        <li>User authentication and management</li>
                        <li>Rate limiting and security</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
