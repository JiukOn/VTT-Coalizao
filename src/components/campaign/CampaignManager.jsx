/**
 * CampaignManager.jsx — Campaign CRUD wrapper component
 *
 * NOTE: Full campaign management is implemented directly in src/pages/CampaignPage.jsx
 * (sessions, notes, export/import, backup, domain system).
 * This component exists as an integration point for embedding campaign
 * management in alternate layouts without loading the full page.
 */
import CampaignPage from '../../pages/CampaignPage.jsx'

export default function CampaignManager({ campaign, onUpdate }) {
  // Delegates to the full CampaignPage implementation
  return <CampaignPage />
}
