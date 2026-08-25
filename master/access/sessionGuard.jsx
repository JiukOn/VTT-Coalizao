/* ============================================================
   sessionGuard.jsx — Master session HOC guard
   Wraps the Master app to ensure authentication.
   Currently a pass-through (open-door policy).
   In a future version, could show a PIN screen.
   ============================================================ */

import { useMasterAuth } from './masterAuth.js'

/**
 * SessionGuard — Higher-Order Component that protects the Master UI.
 * If the user is not authenticated, redirects to a login screen.
 * Currently: auto-authenticates on first render.
 *
 * @param {{ children: React.ReactNode }} props
 */
export default function SessionGuard({ children }) {
  const isAuth = useMasterAuth()
  if (!isAuth) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p>Autenticando...</p>
      </div>
    )
  }
  return children
}
