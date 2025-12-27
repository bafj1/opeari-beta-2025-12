import { useState, useRef } from 'react'

interface PhotoUploadProps {
  currentPhotoUrl: string | null
  firstName: string
  onPhotoChange: (file: File) => Promise<void>
  onPhotoRemove?: () => void
  size?: 'sm' | 'md' | 'lg'
}

export default function PhotoUpload({
  currentPhotoUrl,
  firstName,
  onPhotoChange,
  onPhotoRemove,
  size = 'md'
}: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  }

  const textSizes = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-4xl'
  }

  const handleFileSelect = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    setError(null)
    setIsUploading(true)

    try {
      await onPhotoChange(file)
    } catch (err) {
      setError('Failed to upload photo')
    } finally {
      setIsUploading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const initials = firstName ? firstName.charAt(0).toUpperCase() : '?'

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Photo/Avatar circle */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          ${sizeClasses[size]} rounded-full cursor-pointer relative
          overflow-hidden transition-all
          ${dragOver
            ? 'ring-4 ring-primary ring-offset-2'
            : 'hover:ring-4 hover:ring-primary/30 hover:ring-offset-2'
          }
          ${isUploading ? 'opacity-50' : ''}
        `}
      >
        {currentPhotoUrl ? (
          <img
            src={currentPhotoUrl}
            alt={`${firstName}'s profile photo`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`
            w-full h-full bg-mint flex items-center justify-center
            ${textSizes[size]} font-bold text-primary
          `}>
            {initials}
          </div>
        )}

        {/* Overlay on hover */}
        <div className={`
          absolute inset-0 bg-opeari-green/50 flex items-center justify-center
          opacity-0 hover:opacity-100 transition-opacity
        `}>
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>

        {/* Loading spinner */}
        {isUploading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-sm text-primary font-medium hover:underline"
        >
          {currentPhotoUrl ? 'Change photo' : 'Add photo'}
        </button>

        {currentPhotoUrl && onPhotoRemove && (
          <button
            type="button"
            onClick={onPhotoRemove}
            className="text-sm text-text-muted hover:text-coral"
          >
            Remove
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-coral">{error}</p>
      )}

      {/* Help text */}
      <p className="text-xs text-text-muted text-center">
        Families want to see who they're connecting with!
      </p>
    </div>
  )
}