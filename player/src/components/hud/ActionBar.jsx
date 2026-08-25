/* ActionBar.jsx — Floating quick-action bar for player screen */
import { useState } from 'react'
import {
  Swords, Zap, Heart, Dices, ChevronUp, ChevronDown,
  Crosshair, Footprints, Plus, Minus, FlaskConical, Shield, Sparkles,
  Ghost, RefreshCw
} from 'lucide-react'
import { rollDice, classifyD20, classifyD4 } from '../../utils/diceRoller.js'
import { ATTRIBUTES, getBonus, calculateShortMovement } from '../../utils/characterUtils.js'
import { toggleStealthMode, calculateStealthScore } from '@shared/utils/stealthUtils.js'
import { getWeaponAmmo, consumeWeaponAmmo, reloadWeaponAmmo } from '@shared/utils/ammoTracker.js'
import { resolveOvercharge } from '@shared/utils/weaponOvercharge.js'
import { sfx } from '@shared/utils/sfxPlayer.js'

export default function ActionBar({
  entity,
  playerName,
  wsSend,
  addLog,
  hasTarget = false,
  targetName = null,
  targetDistance = null,
  targetCover = null,
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [activeSubmenu, setActiveSubmenu] = useState(null) // 'attributes' | 'spells' | 'hp' | null
  const [rollMode, setRollMode] = useState('normal') // 'normal' | 'advantage' | 'disadvantage'
  const [isOvercharge, setIsOvercharge] = useState(false)

  if (!entity) return null

  const hp = entity.hp ?? 0
  const maxHp = entity.maxHp ?? entity.vitMax ?? (entity.attributes?.vit ? entity.attributes.vit * 2 : 20)
  const hpPercent = maxHp > 0 ? Math.max(0, Math.min(100, (hp / maxHp) * 100)) : 0

  const enr = entity.enr ?? 0
  const maxEnr = entity.maxEnr ?? (entity.attributes?.enr ? entity.attributes.enr * 2 : 20)
  const enrPercent = maxEnr > 0 ? Math.max(0, Math.min(100, (enr / maxEnr) * 100)) : 0

  const attrs = entity.attributes || {}

  // ── Quick Roll Attribute ───────────────────────────────────────────────────
  const rollAttribute = (attrKey, attrName) => {
    sfx.init()
    sfx.play('dice_roll')
    const rawVal = attrs[attrKey] ?? 0
    const bonus = getBonus(rawVal)

    const isSuper = rollMode === 'super_advantage'
    const isAdv = rollMode === 'advantage'
    const isDis = rollMode === 'disadvantage'
    const count = isSuper ? 3 : (isAdv || isDis ? 2 : 1)
    const results = rollDice(count, 20)
    const d20 = isSuper || isAdv ? Math.max(...results) : (isDis ? Math.min(...results) : results[0])
    const modeTag = isSuper ? ' (⭐ Super-Vantagem)' : (isAdv ? ' (Vantagem)' : (isDis ? ' (Desvantagem)' : ''))

    const classification = classifyD20(d20)
    const total = d20 + bonus

    const sign = bonus >= 0 ? `+${bonus}` : `${bonus}`
    const resultText = `🎲 Teste de **${attrName}** (${attrKey.toUpperCase()})${modeTag}: [${results.join(', ')}] ➔ [${d20}] ${sign} = **${total}** — *${classification.label}*`

    const rollData = {
      rollerName: playerName,
      avatar: entity.avatar,
      diceType: `1d20${sign} (${attrName})${modeTag}`,
      result: total,
      raw: results,
      modifier: bonus,
      classification,
    }
    addLog(resultText, null, rollData)
    if (wsSend) {
      wsSend('dice_roll', {
        data: {
          playerName,
          diceType: `1d20${sign} (${attrName})`,
          result: total,
          raw: [d20],
        },
      })
      wsSend('chat_message', {
        text: resultText,
        timestamp: new Date().toISOString(),
      })
    }
    setActiveSubmenu(null)
  }

  // ── Quick Short Movement (D4) ──────────────────────────────────────────────
  const rollMovement = () => {
    sfx.init()
    sfx.play('dice_roll')
    const dexBonus = getBonus(attrs.dex ?? 0)
    const [d4] = rollDice(1, 4)
    const classification = classifyD4(d4)
    const meters = calculateShortMovement(d4, dexBonus)
    const resultText = `🏃 **Movimento Curto**: [d4=${d4} *${classification.label}*] com DEX +${dexBonus} ➔ **${meters} metros**`

    const rollData = {
      rollerName: playerName,
      avatar: entity.avatar,
      diceType: '1d4 (Movimento)',
      result: meters,
      raw: [d4],
      modifier: dexBonus,
      classification,
      note: `1d4 (${d4}) + DEX (${dexBonus}) = ${meters} metros`,
    }
    addLog(resultText, null, rollData)
    if (wsSend) {
      wsSend('dice_roll', {
        data: {
          playerName,
          diceType: '1d4 (Movimento)',
          result: meters,
          raw: [d4],
        },
      })
      wsSend('chat_message', {
        text: resultText,
        timestamp: new Date().toISOString(),
      })
    }
  }

  // ── Quick Melee / Ranged Attack ──────────────────────────────────────────
  const rollQuickAttack = (type = 'melee') => {
    const isMelee = type === 'melee'
    const equippedWeapon = entity.equipment?.mainHand || null
    const weaponName = equippedWeapon?.name || (isMelee ? 'Corpo a Corpo' : 'à Distância')

    // Ammo check for ranged weapons
    if (!isMelee) {
      const ammoStatus = getWeaponAmmo(equippedWeapon)
      if (ammoStatus.current <= 0) {
        sfx.init()
        sfx.play('combat_miss')
        addLog(`⚠️ **Pente vazio!** ${weaponName} precisa ser recarregada.`)
        return
      }
      const ammoRes = consumeWeaponAmmo(equippedWeapon, 1)
      if (wsSend && ammoRes.updatedWeapon) {
        const updatedEquip = { ...(entity.equipment || {}), mainHand: ammoRes.updatedWeapon }
        wsSend('token_move', { data: { id: entity.tableId || entity.id, changes: { equipment: updatedEquip } } })
      }
    }

    sfx.init()
    sfx.play('dice_roll')
    const attrKey = isMelee ? 'frc' : 'pre'
    const attrName = isMelee ? 'Força' : 'Precisão'
    const attrBonus = getBonus(attrs[attrKey] ?? 0)
    const weaponBonus = equippedWeapon?.attackBonus || 0
    const totalBonus = attrBonus + weaponBonus

    const isSuper = rollMode === 'super_advantage'
    const isAdv = rollMode === 'advantage'
    const isDis = rollMode === 'disadvantage'
    const count = isSuper ? 3 : (isAdv || isDis ? 2 : 1)
    const results = rollDice(count, 20)
    const d20 = isSuper || isAdv ? Math.max(...results) : (isDis ? Math.min(...results) : results[0])
    const modeTag = isSuper ? ' [⭐ Super-Vantagem]' : (isAdv ? ' [Vantagem]' : (isDis ? ' [Desvantagem]' : ''))

    const classification = classifyD20(d20)

    // Overcharge check for ranged attacks
    let overchargeTag = ''
    if (!isMelee && isOvercharge) {
      const ocRes = resolveOvercharge(d20)
      if (ocRes.isOverheated) {
        sfx.init()
        sfx.play('combat_hit')
        addLog(ocRes.message)
        if (wsSend) {
          const curEnr = entity.enr ?? 0
          const nextEnr = Math.max(0, curEnr - 2)
          wsSend('token_move', { data: { id: entity.tableId || entity.id, changes: { enr: nextEnr } } })
          wsSend('chat_message', { text: ocRes.message, timestamp: new Date().toISOString() })
        }
        return
      }
      overchargeTag = ` [⚡ +${ocRes.extraDamage} Plasma]`
    }

    const total = d20 + totalBonus
    const sign = totalBonus >= 0 ? `+${totalBonus}` : `${totalBonus}`

    const targetDesc = targetName ? ` contra **${targetName}**` : ''
    const distDesc = targetDistance != null ? ` (${targetDistance.toFixed(1)}m)` : ''
    const resultText = `⚔️ **Ataque (${weaponName})${modeTag}${overchargeTag}**${targetDesc}${distDesc}: [${results.join(', ')}] ➔ [${d20}] ${sign} (${attrName}) = **${total}** — *${classification.label}*`

    const rollData = {
      rollerName: playerName,
      avatar: entity.avatar,
      diceType: `1d20${sign} (${weaponName})${modeTag}`,
      result: total,
      raw: results,
      modifier: totalBonus,
      classification,
      targetName,
      note: equippedWeapon?.damage ? `Arma: ${weaponName} | Dano: ${equippedWeapon.damage}` : (isMelee ? 'Rolagem de Ataque FRC vs FRC' : 'Rolagem de Ataque PRE vs DEX'),
    }
    addLog(resultText, null, rollData)
    if (wsSend) {
      wsSend('dice_roll', {
        data: {
          playerName,
          diceType: `1d20${sign} (${isMelee ? 'Ataque CaC' : 'Ataque Dist'})${modeTag}`,
          result: total,
          raw: results,
        },
      })
      wsSend('chat_message', {
        text: resultText,
        timestamp: new Date().toISOString(),
      })
      if (targetName) {
        wsSend('combat_event', {
          data: {
            summary: `${playerName} atacou ${targetName} (${total})`,
            attacker: playerName,
            defender: targetName,
          },
        })
      }
    }
  }

  // ── Tactical Reload ───────────────────────────────────────────────────────
  const handleReload = () => {
    const equippedWeapon = entity.equipment?.mainHand || null
    if (!equippedWeapon) return
    sfx.init()
    sfx.play('turn_alert')
    const res = reloadWeaponAmmo(equippedWeapon)
    if (wsSend && res.updatedWeapon) {
      const updatedEquip = { ...(entity.equipment || {}), mainHand: res.updatedWeapon }
      wsSend('token_move', { data: { id: entity.tableId || entity.id, changes: { equipment: updatedEquip } } })
    }
    addLog(res.message)
  }

  // ── Toggle Stealth Mode ───────────────────────────────────────────────────
  const handleToggleStealth = () => {
    sfx.init()
    sfx.play('turn_alert')
    const isCurrentlyStealth = !!entity.stealth?.active
    const d20 = rollDice(1, 20)[0]
    const dexBonus = getBonus(attrs.dex ?? 0)
    const score = calculateStealthScore(dexBonus, d20)
    const updated = toggleStealthMode(entity, !isCurrentlyStealth, score)
    if (wsSend) {
      wsSend('token_move', { data: { id: entity.tableId || entity.id, changes: { stealth: updated.stealth } } })
    }
    const msg = !isCurrentlyStealth
      ? `🥷 **${playerName}** entrou em **Modo Furtivo** (Teste de Furtividade: 1d20 [${d20}] ${dexBonus >= 0 ? '+' : ''}${dexBonus} = **${score}**).`
      : `👁️ **${playerName}** saiu do Modo Furtivo.`
    addLog(msg)
    if (wsSend) wsSend('chat_message', { text: msg, timestamp: new Date().toISOString() })
  }

  // ── Quick HP Adjust ────────────────────────────────────────────────────────
  const adjustHp = (delta) => {
    const nextHp = Math.max(0, Math.min(maxHp, hp + delta))
    if (nextHp === hp) return
    const isHeal = delta > 0
    sfx.init()
    if (isHeal) sfx.play('turn_alert')
    else sfx.play('combat_hit')

    if (wsSend) {
      wsSend('token_move', {
        data: {
          id: entity.tableId || entity.id,
          changes: { hp: nextHp },
        },
      })
      const logText = isHeal
        ? `💚 ${playerName} recuperou +${delta} HP (${nextHp}/${maxHp})`
        : `🩸 ${playerName} sofreu ${delta} HP (${nextHp}/${maxHp})`
      addLog(logText)
      wsSend('chat_message', { text: logText, timestamp: new Date().toISOString() })
    }
  }

  // ── Quick ENR Adjust ───────────────────────────────────────────────────────
  const adjustEnr = (delta) => {
    const nextEnr = Math.max(0, Math.min(maxEnr, enr + delta))
    if (nextEnr === enr) return
    if (wsSend) {
      wsSend('token_move', {
        data: {
          id: entity.tableId || entity.id,
          changes: { enr: nextEnr },
        },
      })
      const logText = `⚡ ${playerName} ajustou Energia: ${nextEnr}/${maxEnr}`
      addLog(logText)
    }
  }

const QUICK_ITEMS = [
  { key: 'potion_hp', name: 'Poção de Cura', desc: '+10 HP', icon: FlaskConical, color: '#10B981', type: 'hp', amount: 10 },
  { key: 'potion_enr', name: 'Elixir de Energia', desc: '+8 ENR', icon: Zap, color: '#3B82F6', type: 'enr', amount: 8 },
  { key: 'antidote', name: 'Antídoto', desc: 'Cura Veneno / Sangria', icon: Heart, color: '#F59E0B', type: 'cure' },
  { key: 'shield', name: 'Bálsamo Protetor', desc: '+Protegido', icon: Shield, color: '#8B5CF6', type: 'condition', condition: 'shielded' },
]

const QUICK_SPELLS = [
  { key: 'kinetic_beam', name: 'Raio Cinético', cost: 4, attr: 'int', attrName: 'Inteligência', icon: Zap, color: '#38BDF8', desc: 'Dano INT (12m)', isAttack: true },
  { key: 'shockwave',    name: 'Onda de Choque', cost: 6, attr: 'frc', attrName: 'Força', icon: Sparkles, color: '#F59E0B', desc: 'Cone 6m AoE', isAttack: true },
  { key: 'grav_shield',  name: 'Barreira Gravitacional', cost: 5, attr: 'res', attrName: 'Resistência', icon: Shield, color: '#A855F7', desc: '+Protegido', isCondition: 'shielded' },
  { key: 'biotic_heal',  name: 'Restauração Biótica', cost: 4, attr: 'crm', attrName: 'Carisma', icon: Heart, color: '#10B981', desc: 'Cura 1d4+CRM', isHeal: true },
]

  // ── Quick Item Use ─────────────────────────────────────────────────────────
  const handleUseItem = (item) => {
    sfx.init()
    sfx.play('turn_alert')
    if (item.type === 'hp') {
      const nextHp = Math.min(maxHp, hp + item.amount)
      if (wsSend) {
        wsSend('token_move', {
          data: { id: entity.tableId || entity.id, changes: { hp: nextHp } },
        })
      }
      const msg = `🧪 **${playerName}** usou **${item.name}** (+${item.amount} HP ➔ ${nextHp}/${maxHp})`
      addLog(msg)
      if (wsSend) wsSend('chat_message', { text: msg, timestamp: new Date().toISOString() })
    } else if (item.type === 'enr') {
      const nextEnr = Math.min(maxEnr, enr + item.amount)
      if (wsSend) {
        wsSend('token_move', {
          data: { id: entity.tableId || entity.id, changes: { enr: nextEnr } },
        })
      }
      const msg = `⚡ **${playerName}** usou **${item.name}** (+${item.amount} ENR ➔ ${nextEnr}/${maxEnr})`
      addLog(msg)
      if (wsSend) wsSend('chat_message', { text: msg, timestamp: new Date().toISOString() })
    } else if (item.type === 'cure') {
      const curConds = entity.conditions || []
      const nextConds = curConds.filter(c => c !== 'poisoned' && c !== 'bleeding')
      if (wsSend) {
        wsSend('token_move', {
          data: { id: entity.tableId || entity.id, changes: { conditions: nextConds } },
        })
      }
      const msg = `🌿 **${playerName}** usou **${item.name}** (Veneno e Sangria curados!)`
      addLog(msg)
      if (wsSend) wsSend('chat_message', { text: msg, timestamp: new Date().toISOString() })
    } else if (item.type === 'condition') {
      const curConds = entity.conditions || []
      if (!curConds.includes(item.condition)) {
        const nextConds = [...curConds, item.condition]
        if (wsSend) {
          wsSend('token_move', {
            data: { id: entity.tableId || entity.id, changes: { conditions: nextConds } },
          })
        }
      }
      const msg = `🛡️ **${playerName}** usou **${item.name}** (Condição Protegido ativada!)`
      addLog(msg)
      if (wsSend) wsSend('chat_message', { text: msg, timestamp: new Date().toISOString() })
    }
    setActiveSubmenu(null)
  }

  // ── Quick Spell / Skill Cast ───────────────────────────────────────────────
  const handleCastSpell = (spell) => {
    if (enr < spell.cost) {
      sfx.init()
      sfx.play('combat_miss')
      addLog(`⚠️ Energia insuficiente para **${spell.name}** (Necessário: ${spell.cost} ENR, Atual: ${enr} ENR)`)
      return
    }

    const nextEnr = Math.max(0, enr - spell.cost)
    if (wsSend) {
      wsSend('token_move', {
        data: { id: entity.tableId || entity.id, changes: { enr: nextEnr } },
      })
    }

    sfx.init()
    sfx.play('dice_roll')

    if (spell.isHeal) {
      const crmBonus = getBonus(attrs.crm ?? 0)
      const [d4] = rollDice(1, 4)
      const healAmount = Math.max(1, d4 + crmBonus)
      const cl = classifyD4(d4)
      const resultText = `✨ **${playerName}** conjurou **${spell.name}** [-${spell.cost} ENR]: Cura de [d4=${d4} *${cl.label}*] + CRM(${crmBonus}) = **+${healAmount} HP**`
      const rollData = {
        rollerName: playerName,
        avatar: entity.avatar,
        diceType: `1d4+${crmBonus} (${spell.name})`,
        result: healAmount,
        raw: [d4],
        modifier: crmBonus,
        classification: cl,
        targetName,
        note: `Custo: ${spell.cost} ENR | Restauração Biótica`,
      }
      addLog(resultText, null, rollData)
      if (wsSend) {
        wsSend('dice_roll', { data: { playerName, diceType: '1d4 (Cura)', result: healAmount, raw: [d4] } })
        wsSend('chat_message', { text: resultText, timestamp: new Date().toISOString() })
      }
    } else {
      const attrVal = attrs[spell.attr] ?? 0
      const bonus = getBonus(attrVal)
      const [d20] = rollDice(1, 20)
      const cl = classifyD20(d20)
      const total = d20 + bonus
      const sign = bonus >= 0 ? `+${bonus}` : `${bonus}`
      const targetDesc = targetName ? ` contra **${targetName}**` : ''
      const resultText = `🔮 **${playerName}** conjurou **${spell.name}** [-${spell.cost} ENR]${targetDesc}: [${d20}] ${sign} (${spell.attrName}) = **${total}** — *${cl.label}*`

      if (spell.isCondition) {
        const curConds = entity.conditions || []
        if (!curConds.includes(spell.isCondition)) {
          if (wsSend) {
            wsSend('token_move', {
              data: { id: entity.tableId || entity.id, changes: { conditions: [...curConds, spell.isCondition] } },
            })
          }
        }
      }

      const rollData = {
        rollerName: playerName,
        avatar: entity.avatar,
        diceType: `1d20${sign} (${spell.name})`,
        result: total,
        raw: [d20],
        modifier: bonus,
        classification: cl,
        targetName,
        note: `Custo: ${spell.cost} ENR | ${spell.desc}`,
      }
      addLog(resultText, null, rollData)
      if (wsSend) {
        wsSend('dice_roll', { data: { playerName, diceType: `1d20${sign} (${spell.name})`, result: total, raw: [d20] } })
        wsSend('chat_message', { text: resultText, timestamp: new Date().toISOString() })
        if (targetName) {
          wsSend('combat_event', { data: { summary: `${playerName} conjurou ${spell.name} em ${targetName} (${total})`, attacker: playerName, defender: targetName } })
        }
      }
    }
    setActiveSubmenu(null)
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      pointerEvents: 'none',
    }}>
      {/* Spells & Skills submenu popover */}
      {activeSubmenu === 'spells' && !collapsed && (
        <div style={{
          pointerEvents: 'auto',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px 12px 0 0',
          padding: '10px 14px',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 8,
          boxShadow: '0 -8px 24px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(10px)',
          marginBottom: -1,
          minWidth: 320,
        }}>
          {QUICK_SPELLS.map(spell => {
            const Icon = spell.icon
            const hasEnergy = enr >= spell.cost
            return (
              <button
                key={spell.key}
                onClick={() => handleCastSpell(spell)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: `1px solid ${hasEnergy ? spell.color : 'var(--border-subtle)'}`,
                  background: hasEnergy ? `${spell.color}15` : 'rgba(0,0,0,0.2)',
                  opacity: hasEnergy ? 1 : 0.55,
                  color: 'var(--text-primary)',
                  cursor: hasEnergy ? 'pointer' : 'not-allowed',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textAlign: 'left',
                }}
              >
                <Icon size={16} style={{ color: spell.color, flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>{spell.name}</span>
                    <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#60A5FA', fontWeight: 700 }}>
                      ({spell.cost} ENR)
                    </span>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 400 }}>{spell.desc}</span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Items submenu popover */}
      {activeSubmenu === 'items' && !collapsed && (
        <div style={{
          pointerEvents: 'auto',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px 12px 0 0',
          padding: '10px 14px',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 8,
          boxShadow: '0 -8px 24px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(10px)',
          marginBottom: -1,
          minWidth: 280,
        }}>
          {QUICK_ITEMS.map(item => {
            const Icon = item.icon
            return (
              <button
                key={item.key}
                onClick={() => handleUseItem(item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: `1px solid ${item.color}44`,
                  background: `${item.color}15`,
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textAlign: 'left',
                }}
              >
                <Icon size={16} style={{ color: item.color, flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span>{item.name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 400 }}>{item.desc}</span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Attributes submenu popover */}
      {activeSubmenu === 'attributes' && !collapsed && (
        <div style={{
          pointerEvents: 'auto',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px 12px 0 0',
          padding: '10px 14px',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
          boxShadow: '0 -8px 24px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(10px)',
          marginBottom: -1,
        }}>
          {ATTRIBUTES.map(attr => {
            const val = attrs[attr.key] ?? 0
            const bonus = getBonus(val)
            return (
              <button
                key={attr.key}
                onClick={() => rollAttribute(attr.key, attr.name)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                <span>{attr.abbr}</span>
                <span style={{ color: bonus >= 0 ? '#4ADE80' : '#F87171', fontFamily: 'var(--font-mono)' }}>
                  {bonus >= 0 ? `+${bonus}` : bonus}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Main floating action bar */}
      <div style={{
        pointerEvents: 'auto',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderBottom: 'none',
        borderRadius: '12px 12px 0 0',
        padding: collapsed ? '4px 12px' : '8px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(12px)',
        maxWidth: '96vw',
        transition: 'all 0.2s ease',
      }}>
        {/* Toggle collapse */}
        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expandir Action Bar' : 'Recolher Action Bar'}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 2,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {/* Compact Hero Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Avatar / Initial */}
          <div style={{
            width: collapsed ? 24 : 34,
            height: collapsed ? 24 : 34,
            borderRadius: '50%',
            background: 'var(--accent-primary)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: collapsed ? '0.7rem' : '0.85rem',
            boxShadow: '0 0 8px rgba(155,89,232,0.4)',
            overflow: 'hidden',
          }}>
            {entity.avatar ? (
              <img src={entity.avatar} alt={entity.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              (entity.name || '?')[0].toUpperCase()
            )}
          </div>

          {!collapsed && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* HP Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem' }}>
                <Heart size={11} style={{ color: '#F87171' }} />
                <div style={{ width: 70, height: 6, background: '#333', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    width: `${hpPercent}%`,
                    height: '100%',
                    background: hpPercent > 60 ? '#4ADE80' : hpPercent > 30 ? '#FBBF24' : '#F87171',
                    transition: 'width 0.3s',
                  }} />
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', minWidth: 38 }}>{hp}/{maxHp}</span>
                {/* Quick HP +/- */}
                <button
                  onClick={() => adjustHp(-1)}
                  style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', padding: 0 }}
                  title="-1 HP"
                >
                  <Minus size={10} />
                </button>
                <button
                  onClick={() => adjustHp(1)}
                  style={{ background: 'none', border: 'none', color: '#4ADE80', cursor: 'pointer', padding: 0 }}
                  title="+1 HP"
                >
                  <Plus size={10} />
                </button>
              </div>

              {/* ENR Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem' }}>
                <Zap size={11} style={{ color: '#60A5FA' }} />
                <div style={{ width: 70, height: 6, background: '#333', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    width: `${enrPercent}%`,
                    height: '100%',
                    background: '#60A5FA',
                    transition: 'width 0.3s',
                  }} />
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', minWidth: 38 }}>{enr}/{maxEnr}</span>
                <button
                  onClick={() => adjustEnr(-1)}
                  style={{ background: 'none', border: 'none', color: '#60A5FA', cursor: 'pointer', padding: 0 }}
                  title="-1 ENR"
                >
                  <Minus size={10} />
                </button>
                <button
                  onClick={() => adjustEnr(1)}
                  style={{ background: 'none', border: 'none', color: '#60A5FA', cursor: 'pointer', padding: 0 }}
                  title="+1 ENR"
                >
                  <Plus size={10} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 24, background: 'var(--border-subtle)' }} />

        {/* Target Info (if target selected) */}
        {hasTarget && !collapsed && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            padding: '2px 8px',
            borderRadius: 6,
            fontSize: '0.75rem',
            color: '#F87171',
          }}>
            <Crosshair size={12} />
            <span style={{ fontWeight: 600 }}>{targetName}</span>
            {targetDistance != null && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>({targetDistance.toFixed(1)}m)</span>
            )}
            {targetCover && targetCover.coverType !== 'none' && (
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '1px 5px',
                borderRadius: 4,
                background: `${targetCover.color}25`,
                color: targetCover.color,
                border: `1px solid ${targetCover.color}55`,
              }}>
                🛡️ {targetCover.label}
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Roll Mode Selector (Normal / Advantage / Disadvantage) */}
          {!collapsed && (
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.35)', borderRadius: 6, padding: 2, gap: 2, border: '1px solid var(--border-subtle)' }}>
              <button
                onClick={() => setRollMode('normal')}
                style={{
                  background: rollMode === 'normal' ? 'var(--accent-primary)' : 'transparent',
                  color: rollMode === 'normal' ? '#fff' : 'var(--text-muted)',
                  border: 'none', borderRadius: 4, padding: '2px 6px', fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer',
                }}
                title="Rolagem Normal (1d20)"
              >
                1d20
              </button>
              <button
                onClick={() => setRollMode('advantage')}
                style={{
                  background: rollMode === 'advantage' ? '#10B981' : 'transparent',
                  color: rollMode === 'advantage' ? '#fff' : 'var(--text-muted)',
                  border: 'none', borderRadius: 4, padding: '2px 6px', fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer',
                }}
                title="Vantagem (2d20 Maior)"
              >
                Vant.
              </button>
              <button
                onClick={() => setRollMode('disadvantage')}
                style={{
                  background: rollMode === 'disadvantage' ? '#EF4444' : 'transparent',
                  color: rollMode === 'disadvantage' ? '#fff' : 'var(--text-muted)',
                  border: 'none', borderRadius: 4, padding: '2px 6px', fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer',
                }}
                title="Desvantagem (2d20 Menor)"
              >
                Desv.
              </button>
              <button
                onClick={() => setRollMode(m => m === 'super_advantage' ? 'normal' : 'super_advantage')}
                style={{
                  background: rollMode === 'super_advantage' ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'transparent',
                  color: rollMode === 'super_advantage' ? '#fff' : '#F59E0B',
                  border: 'none', borderRadius: 4, padding: '2px 6px', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer',
                }}
                title="Super-Vantagem (Rola 3d20 e escolhe o Maior)"
              >
                ⭐ 3d20
              </button>
            </div>
          )}

          {/* Quick Melee Attack */}
          <button
            onClick={() => rollQuickAttack('melee')}
            title="Ataque Corpo a Corpo (FRC + D20)"
            className="btn btn-sm btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', padding: '4px 8px' }}
          >
            <Swords size={13} />
            {!collapsed && 'CaC'}
          </button>

          {/* Quick Ranged Attack & Ammo */}
          <button
            onClick={() => rollQuickAttack('ranged')}
            title="Ataque à Distância (PRE + D20)"
            className="btn btn-sm btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', padding: '4px 8px' }}
          >
            <Crosshair size={13} />
            {!collapsed && 'Tiro'}
          </button>

          {/* Quick Reload (if ranged weapon equipped) */}
          {entity.equipment?.mainHand && (
            <button
              onClick={handleReload}
              title="Recarregar Munição da Arma"
              className="btn btn-sm btn-ghost"
              style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.72rem', padding: '4px 6px', color: '#38BDF8' }}
            >
              <RefreshCw size={12} />
              {!collapsed && `${getWeaponAmmo(entity.equipment.mainHand).current}/${getWeaponAmmo(entity.equipment.mainHand).capacity}`}
            </button>
          )}

          {/* Overcharge Mode Toggle */}
          <button
            onClick={() => setIsOvercharge(o => !o)}
            title={isOvercharge ? 'Sobrecarga Ativada (+1d6 Plasma, Falha em 1-3)' : 'Ativar Modo Sobrecarga (+1d6 Dano, Risco de Superaquecimento)'}
            className={`btn btn-sm ${isOvercharge ? 'btn-primary' : 'btn-ghost'}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              fontSize: '0.72rem',
              padding: '4px 6px',
              color: isOvercharge ? '#fff' : '#F59E0B',
              background: isOvercharge ? '#F59E0B' : 'transparent',
            }}
          >
            <Zap size={12} />
            {!collapsed && 'Sobrecarga'}
          </button>

          {/* Stealth Mode Toggle */}
          <button
            onClick={handleToggleStealth}
            title={entity.stealth?.active ? 'Sair do Modo Furtivo' : 'Entrar em Modo Furtivo'}
            className={`btn btn-sm ${entity.stealth?.active ? 'btn-primary' : 'btn-ghost'}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: '0.75rem',
              padding: '4px 8px',
              color: entity.stealth?.active ? '#fff' : '#06B6D4',
              background: entity.stealth?.active ? '#06B6D4' : 'transparent',
            }}
          >
            <Ghost size={13} />
            {!collapsed && (entity.stealth?.active ? `Furtivo (${entity.stealth.score})` : 'Furtivo')}
          </button>

          {/* Quick Movement D4 */}
          <button
            onClick={rollMovement}
            title="Movimento Curto (1d4 + DEX)"
            className="btn btn-sm btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', padding: '4px 8px' }}
          >
            <Footprints size={13} />
            {!collapsed && 'Mover'}
          </button>

          {/* Attribute Rolls Toggle */}
          <button
            onClick={() => setActiveSubmenu(s => s === 'attributes' ? null : 'attributes')}
            title="Rolagens de Atributos"
            className={`btn btn-sm ${activeSubmenu === 'attributes' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', padding: '4px 8px' }}
          >
            <Dices size={13} />
            {!collapsed && 'Atributos'}
          </button>

          {/* Quick Consumable Items Toggle */}
          <button
            onClick={() => setActiveSubmenu(s => s === 'items' ? null : 'items')}
            title="Itens e Consumíveis Rápidos"
            className={`btn btn-sm ${activeSubmenu === 'items' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', padding: '4px 8px' }}
          >
            <FlaskConical size={13} />
            {!collapsed && 'Itens'}
          </button>

          {/* Quick Spells & Skills Toggle */}
          <button
            onClick={() => setActiveSubmenu(s => s === 'spells' ? null : 'spells')}
            title="Grimório de Magias e Habilidades"
            className={`btn btn-sm ${activeSubmenu === 'spells' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', padding: '4px 8px' }}
          >
            <Sparkles size={13} />
            {!collapsed && 'Magias'}
          </button>
        </div>
      </div>
    </div>
  )
}
