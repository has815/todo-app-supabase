import type { Metadata } from 'next'
import './globals.css'
import ClientLayout from './ClientLayout'
import Script from 'next/script' // ← Yeh import add karo

export const metadata: Metadata = {
  title: 'Todo App',
  description: 'Manage your tasks efficiently',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* ResponsiveVoice.js load karo – free key ke saath */}
        <Script
          src="https://code.responsivevoice.org/responsivevoice.js?key=jQ1H3Z3Y"
          strategy="afterInteractive"
        />
      </head>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}