/* CharactersPage.jsx — Hero character management page */
import { useCampaign } from '../context/CampaignContext.jsx'
import CharacterList from '../components/characters/CharacterList.jsx'

export default function CharactersPage({ onSelectEntity, onEntityContextMenu }) {
  const { activeCampaign } = useCampaign()
  const campaignId = activeCampaign?.id ?? 'coalizao'

  return (
    <CharacterList
      campaignId={campaignId}
      onSelectCharacter={onSelectEntity}
      onContextMenu={onEntityContextMenu}
    />
  )
}
