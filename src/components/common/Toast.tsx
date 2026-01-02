import { useEffect } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  onClose: () => void
  duration?: number
}

export default function Toast({ message, type = 'success', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  const bgColor = {
    success: 'bg-primary',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  }[type]

  const icon = {
    success: '🎉',
    error: '❌',
    info: 'ℹ️',
  }[type]

  return (
    <div className="fixed top-20 right-4 z-50 animate-slide-in" role={type === 'error' ? 'alert' : 'status'} aria-live="polite">
      <div className={`${bgColor} text-white px-6 py-4 rounded-2xl shadow-[0_10px_15px_-3px_rgba(30,107,78,0.1),0_4px_6px_-2px_rgba(30,107,78,0.05)] flex items-center gap-3 max-w-sm`}>
        <span className="text-2xl" aria-hidden="true">{icon}</span>
        <p className="font-medium">{message}</p>
        <button
          onClick={onClose}
          aria-label="Close notification"
          className="ml-2 text-white/80 hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  )
}