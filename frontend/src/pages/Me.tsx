export default function Me() {
    return (
        <div className="max-w-3xl">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">My Profile</h1>

            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <p className="text-gray-900">user@example.com (placeholder)</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Account Type
                        </label>
                        <p className="text-gray-900">Free Tier</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Member Since
                        </label>
                        <p className="text-gray-900">-- (placeholder)</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage Statistics</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">URLs Created</p>
                        <p className="text-2xl font-bold text-gray-900">--</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Total Clicks</p>
                        <p className="text-2xl font-bold text-gray-900">--</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
