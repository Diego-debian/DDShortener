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

// Normalize hold_seconds to a valid positive integer
function normalizeHoldSeconds(value: unknown): number {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 1) {
        return Math.floor(parsed);
    }
    return DEFAULT_HOLD_SECONDS;
}

// Helper for weighted random selection
function selectWeightedRandomVideo(videos: Array<{ id: string; weight: number }>): string | null {
    const candidates = videos.filter(v => VIDEO_ID_REGEX.test(v.id) && v.weight > 0);
    if (candidates.length === 0) return null;

    const totalWeight = candidates.reduce((sum, v) => sum + v.weight, 0);
    let random = Math.random() * totalWeight;

    for (const video of candidates) {
        random -= video.weight;
        if (random <= 0) return video.id;
    }
    return candidates[candidates.length - 1].id;
}

export default function Go() {
    const { short_code } = useParams<{ short_code: string }>();
    const [secondsLeft, setSecondsLeft] = useState<number>(DEFAULT_HOLD_SECONDS);
    const [totalSeconds, setTotalSeconds] = useState<number>(DEFAULT_HOLD_SECONDS);
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
    const [isValidShortCode, setIsValidShortCode] = useState<boolean>(true);
    const [configLoaded, setConfigLoaded] = useState<boolean>(false);
    const hasRedirectedRef = useRef<boolean>(false);
    const countdownStartedRef = useRef<boolean>(false);

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
                // Normalize and set hold_seconds from config
                const holdSeconds = normalizeHoldSeconds(data.hold_seconds);
                console.debug('[Go] Config loaded, hold_seconds raw:', data.hold_seconds, '-> normalized:', holdSeconds);

                setTotalSeconds(holdSeconds);
                // Only update countdown if timer hasn't started yet
                if (!countdownStartedRef.current) {
                    setSecondsLeft(holdSeconds);
                }

                // Select video if available
                if (data.videos && data.videos.length > 0) {
                    const mode = data.mode || 'random';
                    console.debug('[Go] Selection mode:', mode);
                    let newSelectedId: string | null = null;

                    if (mode === 'stable') {
                        // Stable selection (explicitly requested)
                        const validVideos = data.videos.filter(v => VIDEO_ID_REGEX.test(v.id));
                        if (validVideos.length > 0) {
                            const index = hashShortCode(short_code) % validVideos.length;
                            newSelectedId = validVideos[index].id;
                            console.debug('[Go] Stably selected video:', newSelectedId);
                        }
                    } else {
                        // Weighted random selection (default)
                        newSelectedId = selectWeightedRandomVideo(data.videos);
                        console.debug('[Go] Randomly selected video:', newSelectedId);
                    }

                    if (newSelectedId) {
                        setSelectedVideo(newSelectedId);
                    }
                }
                setConfigLoaded(true);
            })
            .catch(err => {
                console.warn('[Go] Failed to load promotions config, using fallback:', err.message);
                // Use fallback videos
                if (FALLBACK_VIDEOS.length > 0) {
                    const index = hashShortCode(short_code) % FALLBACK_VIDEOS.length;
                    setSelectedVideo(FALLBACK_VIDEOS[index]);
                }
                setConfigLoaded(true);
            });
    }, [short_code, isValidShortCode]);

    // Countdown timer with setInterval - starts immediately on mount
    useEffect(() => {
        if (!isValidShortCode || !short_code) return;

        countdownStartedRef.current = true;

        const intervalId = setInterval(() => {
            setSecondsLeft(prev => {
                const next = prev - 1;
                console.debug('[Go] Countdown tick:', prev, '->', next);

                // Redirect when reaching 0
                if (next <= 0 && !hasRedirectedRef.current) {
                    hasRedirectedRef.current = true;
                    console.debug('[Go] Redirecting to:', `/${short_code}`);
                    // Use setTimeout to ensure state update completes
                    setTimeout(() => {
                        window.location.href = `/${short_code}`;
                    }, 100);
                }

                return Math.max(0, next);
            });
        }, 1000);

        return () => clearInterval(intervalId);
    }, [short_code, isValidShortCode]);

    const handleOpenYouTube = () => {
        if (!selectedVideo) return;
        window.open(`https://youtube.com/watch?v=${selectedVideo}`, '_blank', 'noopener,noreferrer');
    };

    // Calculate progress percentage
    const progressPercent = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;

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
                        {secondsLeft > 0 ? `Redirigiendo en ${secondsLeft} segundos...` : 'Redirigiendo...'}
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
            <div className="text-center space-y-2">
                <Link
                    to="/dashboard"
                    className="text-gray-500 hover:text-gray-700 text-sm block"
                >
                    ← Volver al Dashboard
                </Link>
                <Link
                    to="/support"
                    className="text-purple-500 hover:text-purple-700 text-xs"
                >
                    ¿Quieres quitar la espera? Apoya el proyecto →
                </Link>
            </div>
        </div>
    );
}
