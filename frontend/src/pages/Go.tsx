import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

interface PromotionsConfig {
    hold_seconds: number;
    videos: Array<{
        id: string;
        weight: number;
    }>;
}

// Validation regexes
const SHORT_CODE_REGEX = /^[A-Za-z0-9_-]{1,64}$/;
const VIDEO_ID_REGEX = /^[A-Za-z0-9_-]{11}$/;

// Simple hash function for stable video selection
function hashShortCode(code: string): number {
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
        hash = ((hash << 5) - hash) + code.charCodeAt(i);
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}

export default function Go() {
    const { short_code } = useParams<{ short_code: string }>();
    const [countdown, setCountdown] = useState<number>(5);
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
    const [isValidShortCode, setIsValidShortCode] = useState<boolean>(true);

    useEffect(() => {
        // Validate short_code
        if (!short_code || !SHORT_CODE_REGEX.test(short_code)) {
            setIsValidShortCode(false);
            return;
        }

        // Fetch promotions config
        fetch('/app-config/promotions.json')
            .then(response => {
                if (!response.ok) throw new Error('Config not found');
                return response.json();
            })
            .then((data: PromotionsConfig) => {
                // Select video if available
                if (data.videos && data.videos.length > 0) {
                    const validVideos = data.videos.filter(v => VIDEO_ID_REGEX.test(v.id));
                    if (validVideos.length > 0) {
                        const index = hashShortCode(short_code) % validVideos.length;
                        setSelectedVideo(validVideos[index].id);
                    }
                }

                setCountdown(data.hold_seconds || 5);
            })
            .catch(err => {
                console.warn('Failed to load promotions config, using fallback:', err.message);
                setCountdown(5);
            });
    }, [short_code]);

    useEffect(() => {
        if (!isValidShortCode) return;
        if (countdown <= 0) {
            // Redirect to backend short URL (NOT React Router navigate)
            window.location.href = `/${short_code}`;
            return;
        }

        const timer = setTimeout(() => {
            setCountdown(c => c - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [countdown, short_code, isValidShortCode]);

    const handleGoNow = () => {
        if (!short_code) return;
        window.location.href = `/${short_code}`;
    };

    const handleOpenYouTube = () => {
        if (!selectedVideo) return;
        window.open(`https://youtube.com/watch?v=${selectedVideo}`, '_blank', 'noopener,noreferrer');
    };

    if (!isValidShortCode) {
        return (
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Invalid Short Code</h1>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-red-900 mb-2">⚠️ Invalid URL</h3>
                    <p className="text-red-700 mb-4">
                        The short code "{short_code}" contains invalid characters or is too long.
                    </p>
                    <p className="text-red-600 text-sm">
                        Short codes can only contain letters, numbers, hyphens, and underscores (up to 64 characters).
                    </p>
                </div>
                <Link
                    to="/dashboard"
                    className="inline-block bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                    ← Back to Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Get Ready...</h1>

            {/* YouTube Embed */}
            {selectedVideo && (
                <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
                    <div className="aspect-video">
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube-nocookie.com/embed/${selectedVideo}?autoplay=1&mute=1&controls=1&rel=0`}
                            title="Promotional Video"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full"
                        />
                    </div>
                </div>
            )}

            {/* Countdown Card */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-lg p-8 mb-6 text-white text-center">
                <h2 className="text-2xl font-semibold mb-4">Redirecting to your link...</h2>
                <div className="text-6xl font-bold mb-4">{countdown}</div>
                <p className="text-purple-100">
                    {countdown > 0 ? 'seconds remaining' : 'Redirecting now...'}
                </p>
            </div>

            {/* Short Code Info */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Short Code</h3>
                <p className="text-2xl font-mono text-blue-600 mb-4">{short_code}</p>
                <p className="text-gray-600 text-sm">
                    You will be redirected to the destination URL shortly.
                </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
                <button
                    onClick={handleGoNow}
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 font-semibold"
                >
                    Ir ahora →
                </button>
                {selectedVideo && (
                    <button
                        onClick={handleOpenYouTube}
                        className="flex-1 bg-red-600 text-white py-3 px-6 rounded-md hover:bg-red-700 font-semibold"
                    >
                        Ver en YouTube
                    </button>
                )}
            </div>

            {/* Back Link */}
            <div className="mt-6 text-center">
                <Link
                    to="/dashboard"
                    className="text-blue-600 hover:text-blue-700 text-sm"
                >
                    ← Back to Dashboard
                </Link>
            </div>
        </div>
    );
}
