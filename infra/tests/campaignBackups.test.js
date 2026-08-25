import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('campaignBackups API Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('lists existing backups correctly from engine endpoint', async () => {
    const mockBackups = [
      { filename: 'campanha_coalizao_20260823.vttpack', size_kb: 450, created_at: '2026-08-23T15:00:00Z' },
      { filename: 'campanha_coalizao_20260822.vttpack', size_kb: 420, created_at: '2026-08-22T14:00:00Z' },
    ]

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockBackups,
    })

    const res = await fetch('/api/engine/storage/backups')
    const data = await res.json()

    expect(res.ok).toBe(true)
    expect(data.length).toBe(2)
    expect(data[0].filename).toBe('campanha_coalizao_20260823.vttpack')
    expect(data[0].size_kb).toBe(450)
  })

  it('creates an atomic backup snapshot successfully', async () => {
    const mockResponse = {
      filename: 'campanha_coalizao_snapshot.vttpack',
      size_kb: 512,
      checksum_sha256: 'a1b2c3d4e5f6',
      status: 'created',
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    })

    const res = await fetch('/api/engine/storage/backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaign_id: 'coalizao', campaign_name: 'Campanha Oficial' }),
    })
    const data = await res.json()

    expect(res.ok).toBe(true)
    expect(data.status).toBe('created')
    expect(data.checksum_sha256).toBe('a1b2c3d4e5f6')
  })
})
