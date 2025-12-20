import { useEffect } from 'react'

interface ToastProps {
    message: string
    type?: 'success' | 'error' | 'info'
    onClose: () => void
    duration?: number
}

export default function Toast({ message, type = 'info', onClose, duration = 3000 }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(onClose, duration)
        return () => clearTimeout(timer)
    }, [duration, onClose])

    const bgColors = {
        success: 'bg-[#1e6b4e]',
        error: 'bg-red-600',
        info: 'bg-[#527a6a]'
    }

    return (
        <div className={`fixed bottom-4 right-4 ${bgColors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-up flex items-center gap-3`}>
            <span>{message}</span>
            <button onClick={onClose} className="opacity-80 hover:opacity-100 font-bold ml-2">×</button>
        </div>
    )
}
