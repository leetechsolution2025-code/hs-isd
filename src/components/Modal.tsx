import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import Button from './Button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  headerActions?: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '5xl' | 'full'
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  headerActions,
  maxWidth = 'md'
}: ModalProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isMounted || !isOpen) return null

  const maxWidthClasses = {
    sm: 'max-w-sm max-h-[90vh] rounded-xl',
    md: 'max-w-md max-h-[90vh] rounded-xl',
    lg: 'max-w-lg max-h-[90vh] rounded-xl',
    xl: 'max-w-xl max-h-[90vh] rounded-xl',
    '2xl': 'max-w-2xl max-h-[90vh] rounded-xl',
    '5xl': 'max-w-5xl max-h-[90vh] rounded-xl',
    'full': 'max-w-none w-screen h-screen rounded-none'
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${maxWidth === 'full' ? 'p-0' : 'p-4'}`}>
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className={`relative bg-white shadow-xl w-full ${maxWidthClasses[maxWidth]} flex flex-col animate-in fade-in zoom-in duration-200`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <div className="flex items-center gap-3">
            {headerActions}
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Body */}
        <div className={`flex-1 overflow-y-auto ${maxWidth === 'full' ? 'p-0 flex flex-col min-h-0' : 'p-6'}`}>
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
