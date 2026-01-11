import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';

interface PromotionsConfig {
    hold_seconds: number;
    mode?: 'stable' | 'random' | 'rotate';
    videos: Array<{
        id: string;
        weight: number;
        title?: string;
    }>;
}

// Validation regexes
const SHORT_CODE_REGEX = /^[A-Za-z0-9_-]{1,64}$/;
const VIDEO_ID_REGEX = /^[A-Za-z0-9_-]{11}$/;

// Fallback video IDs (if config fails)
const FALLBACK_VIDEOS = ['dQw4w9WgXcQ', 'jNQXAC9IVRw', '9bZkp7q19f0'];
const DEFAULT_HOLD_SECONDS = 10;

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
    const [countdown, setCountdown] = useState<number>(DEFAULT_HOLD_SECONDS);
    const [totalSeconds, setTotalSeconds] = useState<number>(DEFAULT_HOLD_SECONDS);
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
    const [isValidShortCode, setIsValidShortCode] = useState<boolean>(true);
    const [configLoaded, setConfigLoaded] = useState<boolean>(false);
    const timerStartedRef = useRef<boolean>(false);

    // Validate short_code on mount
    useEffect(() => {
        if (!short_code || !SHORT_CODE_REGEX.test(short_code)) {
            setIsValidShortCode(false);
        }
    }, [short_code]);

    // Fetch promotions config
    useEffect(() => {
        if (!isValidShortCode || !short_code) return;

        fetch('/app-config/promotions.json')
            .then(response => {
                if (!response.ok) throw new Error('Config not found');
                return response.json();
            })
            .then((data: PromotionsConfig) => {
                // Set hold_seconds from config
                const holdSeconds = data.hold_seconds || DEFAULT_HOLD_SECONDS;
                setTotalSeconds(holdSeconds);
                if (!timerStartedRef.current) {
                    setCountdown(holdSeconds);
                }

                // Select video if available
                if (data.videos && data.videos.length > 0) {
                    const validVideos = data.videos.filter(v => VIDEO_ID_REGEX.test(v.id));
                    if (validVideos.length > 0) {
                        const index = hashShortCode(short_code) % validVideos.length;
                        setSelectedVideo(validVideos[index].id);
                    }
                }
                setConfigLoaded(true);
            })
            .catch(err => {
                console.warn('Failed to load promotions config, using fallback:', err.message);
                // Use fallback videos
                if (FALLBACK_VIDEOS.length > 0) {
                    const index = hashShortCode(short_code) % FALLBACK_VIDEOS.length;
                    setSelectedVideo(FALLBACK_VIDEOS[index]);
                }
                setConfigLoaded(true);
            });
    }, [short_code, isValidShortCode]);

    // Start countdown timer (runs regardless of config load status)
    useEffect(() => {
        if (!isValidShortCode) return;

        // Start timer immediately
        timerStartedRef.current = true;

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

    const handleOpenYouTube = () => {
        if (!selectedVideo) return;
        window.open(`https://youtube.com/watch?v=${selectedVideo}`, '_blank', 'noopener,noreferrer');
    };

    // Calculate progress percentage
    const progressPercent = totalSeconds > 0 ? ((totalSeconds - countdown) / totalSeconds) * 100 : 0;

    if (!isValidShortCode) {
        return (
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Código Inválido</h1>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-red-900 mb-2">⚠️ URL Inválida</h3>
                    <p className="text-red-700 mb-4">
                        El código "{short_code}" contiene caracteres inválidos o es demasiado largo.
                    </p>
                    <p className="text-red-600 text-sm">
                        Los códigos solo pueden contener letras, números, guiones y guiones bajos (máximo 64 caracteres).
                    </p>
                </div>
                <Link
                    to="/dashboard"
                    className="inline-block bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                    ← Volver al Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Main Card */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white text-center">
                    <h1 className="text-2xl font-bold mb-2">
                        {countdown > 0 ? `Redirigiendo en ${countdown} segundos...` : 'Redirigiendo...'}
                    </h1>
                    <p className="text-purple-100">
                        Mientras tanto, mira este short del creador del proyecto.
                    </p>

                    {/* Progress Bar */}
                    <div className="mt-4 w-full bg-purple-400/30 rounded-full h-3">
                        <div
                            className="bg-white h-3 rounded-full transition-all duration-1000 ease-linear"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>

                {/* YouTube Embed */}
                <div className="aspect-video bg-gray-900">
                    {selectedVideo ? (
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube-nocookie.com/embed/${selectedVideo}?autoplay=1&mute=1&controls=1&rel=0`}
                            title="Video promocional"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            {configLoaded ? 'Video no disponible' : 'Cargando recomendación...'}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 flex justify-between items-center">
                    <div>
                        <p className="text-sm text-gray-600">Destino:</p>
                        <p className="font-mono text-blue-600">{window.location.origin}/{short_code}</p>
                    </div>
                    {selectedVideo && (
                        <button
                            onClick={handleOpenYouTube}
                            className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 font-medium"
                        >
                            Ver en YouTube
                        </button>
                    )}
                </div>
            </div>

            {/* Back Link */}
            <div className="text-center">
                <Link
                    to="/dashboard"
                    className="text-gray-500 hover:text-gray-700 text-sm"
                >
                    ← Volver al Dashboard
                </Link>
            </div>
        </div>
    );
}
