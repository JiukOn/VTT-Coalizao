/**
 * mountCoupling.js — Token Mount and Vehicle Coupling System for Coalizão RPG
 * 
 * Allows riding mounts (horses, beasts, dire wolves) and boarding vehicles (wagons, boats).
 * When the mount/vehicle moves, all coupled riders/passengers move together automatically.
 */

const SIZE_ORDER = {
  tiny: 1,
  pequeno: 2,
  small: 2,
  medio: 3,
  medium: 3,
  grande: 4,
  large: 4,
  huge: 5,
  colossal: 6,
}

/**
 * Checks if a rider entity can mount a target vehicle/creature based on size.
 * @param {object} rider
 * @param {object} mount
 * @returns {boolean}
 */
export function canEntityMount(rider, mount) {
  if (!rider || !mount) return false
  const rid = rider.tableId || rider.id
  const mid = mount.tableId || mount.id
  if (rid && mid && rid === mid) return false
  const riderSizeRank = SIZE_ORDER[(rider.size || 'medio').toLowerCase()] || 3
  const mountSizeRank = SIZE_ORDER[(mount.size || 'grande').toLowerCase()] || 4
  return mountSizeRank >= riderSizeRank
}

/**
 * Couples a rider entity to a mount entity.
 * @param {string} riderId - tableId or id
 * @param {string} mountId - tableId or id
 * @param {Array<object>|object} entityMapOrList
 * @returns {Array<object>} updated entities list
 */
export function coupleTokenToMount(riderId, mountId, entityMapOrList) {
  const isArray = Array.isArray(entityMapOrList)
  const entities = isArray ? entityMapOrList : Object.values(entityMapOrList || {})
  const mount = entities.find(e => (e.tableId || e.id) === mountId)
  if (!mount) return entities

  return entities.map(e => {
    const eid = e.tableId || e.id
    if (eid === riderId) {
      const mx = mount.mapX ?? 0
      const my = mount.mapY ?? 0
      const rx = e.mapX ?? mx
      const ry = e.mapY ?? my
      return {
        ...e,
        mountId: mountId,
        mountOffset: { dx: rx - mx, dy: ry - my },
      }
    }
    return e
  })
}

/**
 * Decouples a rider from its current mount.
 * @param {string} riderId
 * @param {Array<object>|object} entityMapOrList
 * @returns {Array<object>}
 */
export function decoupleTokenFromMount(riderId, entityMapOrList) {
  const isArray = Array.isArray(entityMapOrList)
  const entities = isArray ? entityMapOrList : Object.values(entityMapOrList || {})
  return entities.map(e => {
    if ((e.tableId || e.id) === riderId) {
      const { mountId: _m, mountOffset: _o, ...rest } = e
      return { ...rest, mountId: null, mountOffset: null }
    }
    return e
  })
}

/**
 * Returns all riders currently mounted on a specific vehicle/mount.
 * @param {string} mountId
 * @param {Array<object>|object} entityMapOrList
 * @returns {Array<object>}
 */
export function getRiders(mountId, entityMapOrList) {
  const isArray = Array.isArray(entityMapOrList)
  const entities = isArray ? entityMapOrList : Object.values(entityMapOrList || {})
  return entities.filter(e => e.mountId === mountId)
}

/**
 * Moves a mount and updates all its attached riders simultaneously.
 * @param {string} mountId
 * @param {number} newX
 * @param {number} newY
 * @param {Array<object>|object} entityMapOrList
 * @returns {Array<object>}
 */
export function moveMountAndRiders(mountId, newX, newY, entityMapOrList) {
  const isArray = Array.isArray(entityMapOrList)
  const entities = isArray ? entityMapOrList : Object.values(entityMapOrList || {})
  const mount = entities.find(e => (e.tableId || e.id) === mountId)
  if (!mount) return entities

  const oldX = mount.mapX ?? newX
  const oldY = mount.mapY ?? newY
  const deltaX = newX - oldX
  const deltaY = newY - oldY

  return entities.map(e => {
    const eid = e.tableId || e.id
    if (eid === mountId) {
      return { ...e, mapX: newX, mapY: newY }
    }
    if (e.mountId === mountId) {
      const curX = e.mapX ?? (newX + (e.mountOffset?.dx || 0))
      const curY = e.mapY ?? (newY + (e.mountOffset?.dy || 0))
      return {
        ...e,
        mapX: curX + deltaX,
        mapY: curY + deltaY,
      }
    }
    return e
  })
}
