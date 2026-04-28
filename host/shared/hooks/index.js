/* ============================================================
   VTP COALIZÃO — Custom React Hooks
   Reusable logic for components
   ============================================================ */

import { useState, useEffect, useCallback, useRef } from 'react'
import db from '../../../src/services/database.js'

/**
 * Hook for CRUD operations on a Dexie table
 */
export function useDatabase(tableName) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const results = await db[tableName].toArray()
      setData(results)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [tableName])

  useEffect(() => { refresh() }, [refresh])

  const add = async (item) => {
    const id = await db[tableName].add(item)
    await refresh()
    return id
  }

  const update = async (id, changes) => {
    await db[tableName].update(id, changes)
    await refresh()
  }

  const remove = async (id) => {
    await db[tableName].delete(id)
    await refresh()
  }

  return { data, loading, error, refresh, add, update, remove }
}

/**
 * Hook for dice rolling with history
 */
export function useDiceRoller() {
  const [history, setHistory] = useState([])

  const addToHistory = (result) => {
    setHistory(prev => [result, ...prev].slice(0, 100)) // Keep last 100 rolls
  }

  const clearHistory = () => setHistory([])

  return { history, addToHistory, clearHistory }
}

/**
 * Hook for keyboard shortcuts
 */
export function useKeyboardShortcut(key, callback, modifiers = {}) {
  useEffect(() => {
    const handler = (e) => {
      if (modifiers.ctrl && !e.ctrlKey) return
      if (modifiers.shift && !e.shiftKey) return
      if (modifiers.alt && !e.altKey) return
      if (e.key === key) {
        e.preventDefault()
        callback()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [key, callback, modifiers])
}

/**
 * Hook for localStorage state
 */
export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}

/**
 * Hook for canvas rendering with resize handling
 */
export function useCanvas(draw) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        canvas.width = width * window.devicePixelRatio
        canvas.height = height * window.devicePixelRatio
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
        draw(ctx, width, height)
      }
    })

    resizeObserver.observe(canvas.parentElement)
    return () => resizeObserver.disconnect()
  }, [draw])

  return canvasRef
}
