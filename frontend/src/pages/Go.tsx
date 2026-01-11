import { useParams, Link } from 'react-router-dom'

export default function Go() {
    const { short_code } = useParams()

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Redirect Preview</h1>
            <div className="bg-white rounded-lg shadow p-8">
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Short Code
                    </label>
                    <code className="block bg-gray-100 px-4 py-2 rounded text-lg font-mono">
                        {short_code}
                    </code>
                </div>

                <p className="text-gray-600 mb-6">
                    This page displays the short code before redirection. In production, this would show
                    a preview or redirect confirmation page.
                </p>

                <div className="space-y-3">
                    <Link
                        to={`/stats/${short_code}`}
                        className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                    >
                        View Statistics
                    </Link>
                    <Link
                        to="/dashboard"
                        className="block w-full text-center bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300"
                    >
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    )
}
