import { useState, useMemo, useEffect } from 'react'
import { Copy, Check, Smartphone, Globe, Wifi } from 'lucide-react'
import { generateQRCodeSvg } from '@shared/utils/qrCodeGenerator.js'

export default function ShareSessionModal({ onClose, sessionCode, serverUrl, serverIps = [] }) {
  const [copied, setCopied] = useState(false)
  const [tunnelData, setTunnelData] = useState(null)
  const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

  useEffect(() => {
    if (!sessionCode) return
    fetch(`/api/engine/tunnel/status?code=${sessionCode}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setTunnelData(data) })
      .catch(() => {})
  }, [sessionCode])

  // Default to first LAN IP if running on localhost and LAN IPs are available
  const [selectedIp, setSelectedIp] = useState(() => {
    if (isLocalHost && serverIps && serverIps.length > 0) {
      return serverIps[0]
    }
    return window.location.hostname
  })

  // Compute computed URLs
  const effectiveOrigin = useMemo(() => {
    if (isLocalHost && selectedIp && selectedIp !== 'localhost' && selectedIp !== '127.0.0.1') {
      return window.location.origin.replace(/localhost|127\.0\.0\.1/, selectedIp)
    }
    return window.location.origin
  }, [isLocalHost, selectedIp])

  const effectiveServerUrl = useMemo(() => {
    if (isLocalHost && selectedIp && selectedIp !== 'localhost' && selectedIp !== '127.0.0.1') {
      return (serverUrl || '').replace(/localhost|127\.0\.0\.1/, selectedIp)
    }
    return serverUrl || ''
  }, [isLocalHost, selectedIp, serverUrl])

  const joinUrl = `${effectiveOrigin}/player.html?code=${sessionCode || ''}&server=${encodeURIComponent(effectiveServerUrl)}`

  const qrSvg = useMemo(() => {
    try {
      return generateQRCodeSvg(joinUrl, 200)
    } catch (e) {
      console.error('Error generating QR code', e)
      return ''
    }
  }, [joinUrl])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy', err)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
            Compartilhar Sessão
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>&times;</button>
        </div>

        <div className="flex-col items-center text-center gap-md" style={{ marginBottom: 'var(--space-md)' }}>
          <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>
            Escaneie o QR Code no celular (mesmo Wi-Fi) ou copie o link para conectar à mesa.
          </p>

          <div 
            style={{ 
              background: 'var(--bg-tertiary)', 
              padding: 'var(--space-sm) var(--space-md)', 
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              width: '100%'
            }}
          >
            <div className="stat-label" style={{ marginBottom: 2, fontSize: '0.75rem' }}>Código da Sessão</div>
            <div className="stat-value" style={{ fontSize: '1.8rem', letterSpacing: '2px', color: 'var(--accent-primary)' }}>
              {sessionCode || 'OFFLINE'}
            </div>
          </div>
        </div>

        {/* IP Selector if multiple LAN interfaces exist */}
        {serverIps && serverIps.length > 0 && (
          <div style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>IP da Rede (Wi-Fi/LAN):</span>
            <select 
              className="input" 
              value={selectedIp} 
              onChange={e => setSelectedIp(e.target.value)}
              style={{ flex: 1, padding: '4px 8px', fontSize: '0.82rem' }}
            >
              {serverIps.map(ip => (
                <option key={ip} value={ip}>{ip} (Rede Local)</option>
              ))}
              <option value="localhost">localhost (Apenas este PC)</option>
            </select>
          </div>
        )}

        <div className="flex-col items-center gap-md" style={{ marginBottom: 'var(--space-md)' }}>
          <div 
            style={{ 
              background: '#fff', 
              padding: 'var(--space-sm)', 
              borderRadius: 'var(--radius-md)',
              display: 'inline-block'
            }}
            dangerouslySetInnerHTML={{ __html: qrSvg }} 
          />
        </div>

        <div className="flex gap-sm w-full" style={{ marginBottom: 'var(--space-md)' }}>
          <input 
            type="text" 
            value={joinUrl} 
            readOnly 
            style={{ 
              flex: 1, 
              padding: 'var(--space-sm) var(--space-md)', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem'
            }} 
          />
          <button className="btn btn-primary" onClick={handleCopy} disabled={!sessionCode}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>

        {/* Public IP / Cloud Assist Badge if available */}
        {tunnelData?.public_ip && (
          <div style={{
            marginBottom: 'var(--space-md)', padding: '6px 10px', borderRadius: 6,
            background: 'var(--bg-tertiary)', fontSize: '0.75rem', color: 'var(--text-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <Globe size={13} style={{ color: 'var(--accent-primary)' }} />
            <span>IP Público detectado: <strong>{tunnelData.public_ip}</strong></span>
          </div>
        )}

        <div className="flex items-center gap-sm text-muted" style={{ fontSize: '0.82rem', justifyContent: 'center' }}>
          <Wifi size={14} style={{ color: '#10B981' }} />
          <Smartphone size={15} style={{ color: 'var(--accent-primary)' }} />
          <span>No celular no Wi-Fi: aponte a câmera para o QR Code.</span>
        </div>
      </div>
    </div>
  )
}
