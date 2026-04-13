import { createContext, useContext, useState, useEffect } from 'react'
import { db } from '../services/database.js'

const CampaignContext = createContext()

export function CampaignProvider({ children }) {
  const [activeCampaign, setActiveCampaign] = useState(null)
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCampaigns()
  }, [])

  const loadCampaigns = async () => {
    try {
      const allCampaigns = await db.campaigns.toArray()
      setCampaigns(allCampaigns)

      const lastActiveId = localStorage.getItem('vtp-active-campaign')
      if (lastActiveId) {
        const campaign = allCampaigns.find(c => c.id === Number(lastActiveId))
        if (campaign) setActiveCampaign(campaign)
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err)
    } finally {
      setLoading(false)
    }
  }

  const selectCampaign = (campaign) => {
    setActiveCampaign(campaign)
    localStorage.setItem('vtp-active-campaign', campaign?.id || '')
  }

  const createCampaign = async (name) => {
    const id = await db.campaigns.add({
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: [],
    })
    await loadCampaigns()
    return id
  }

  return (
    <CampaignContext.Provider value={{
      activeCampaign,
      campaigns,
      loading,
      selectCampaign,
      createCampaign,
      refreshCampaigns: loadCampaigns,
    }}>
      {children}
    </CampaignContext.Provider>
  )
}

export function useCampaign() {
  const ctx = useContext(CampaignContext)
  if (!ctx) throw new Error('useCampaign must be used within CampaignProvider')
  return ctx
}

export default CampaignContext
