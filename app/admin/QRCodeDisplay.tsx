'use client'

import { useEffect, useState } from 'react'

export function QRCodeDisplay({ url }: { url: string }) {
  const [dataUrl, setDataUrl] = useState('')

  useEffect(() => {
    import('qrcode').then(mod => {
      const QRCode = mod.default ?? mod
      QRCode.toDataURL(url, { width: 200, margin: 2 }).then(setDataUrl)
    })
  }, [url])

  if (!dataUrl) return <div className="w-48 h-48 bg-gray-100 rounded-xl animate-pulse mx-auto" />
  return (
    <div className="flex flex-col items-center gap-2">
      <img src={dataUrl} alt="QR Code" className="w-48 h-48 rounded-xl border border-gray-100" />
      <p className="text-xs text-gray-400 text-center max-w-48 break-all">{url}</p>
    </div>
  )
}
