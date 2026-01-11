import { useEffect } from 'react';

export interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'info';
    onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
    useEffect(() => {
        // Auto-dismiss after 3 seconds
        const timer = setTimeout(() => {
            onClose();
        }, 3000);

        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500'
    }[type];

    const icon = {
        success: '✓',
        error: '✕',
        info: 'ℹ'
    }[type];

    return (
        <div
            className={`fixed top-4 right-4 ${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 max-w-sm`}
            role="alert"
            aria-live="polite"
        >
            <span className="font-bold text-lg">{icon}</span>
            <span>{message}</span>
            <button
                onClick={onClose}
                className="ml-2 text-white hover:text-gray-200 font-bold"
                aria-label="Close notification"
            >
                ✕
            </button>
        </div>
    );
}
