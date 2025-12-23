'use client'

import { useEffect } from 'react'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Extension errors ko suppress karo
    const handleError = (event: ErrorEvent) => {
      if (
        event.message.includes('message channel closed') ||
        event.message.includes('Extension context invalidated')
      ) {
        event.preventDefault()
        console.log('Browser extension error suppressed')
      }
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  return <>{children}</>
}