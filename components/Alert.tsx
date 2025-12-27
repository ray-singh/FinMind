'use client'

import { AlertCircle, XCircle, CheckCircle, Info } from 'lucide-react'

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  onClose?: () => void
}

const alertStyles = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: CheckCircle,
    iconColor: 'text-green-500',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: XCircle,
    iconColor: 'text-red-500',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    icon: AlertCircle,
    iconColor: 'text-yellow-500',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: Info,
    iconColor: 'text-blue-500',
  },
}

export default function Alert({ type, title, message, onClose }: AlertProps) {
  const styles = alertStyles[type]
  const Icon = styles.icon

  return (
    <div className={`${styles.bg} ${styles.border} border rounded-lg p-4`}>
      <div className="flex items-start">
        <Icon className={`${styles.iconColor} flex-shrink-0 mr-3`} size={20} />
        <div className="flex-1">
          {title && (
            <h4 className={`font-medium ${styles.text} mb-1`}>{title}</h4>
          )}
          <p className={`text-sm ${styles.text}`}>{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`${styles.text} hover:opacity-70 transition-opacity`}
          >
            <XCircle size={18} />
          </button>
        )}
      </div>
    </div>
  )
}
