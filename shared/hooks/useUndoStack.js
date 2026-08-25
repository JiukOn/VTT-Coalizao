/**
 * useUndoStack.js — Manages a stack of reversible actions
 *
 * Supports undo/redo for dashboard operations like:
 * - add_entity / remove_entity
 * - move_token
 * - apply_damage
 * - apply_effect / remove_effect
 * - change_hp
 *
 * Each action stores { type, timestamp, data, inverse } where
 * 'inverse' is the data needed to reverse the action.
 */
import { useState, useCallback, useEffect, useRef } from 'react'

const MAX_STACK_SIZE = 20

/**
 * @param {object} options
 * @param {function} options.onUndo - callback(inverseAction) called when undo is executed
 * @param {function} options.onRedo - callback(action) called when redo is executed
 * @param {number} options.maxSize - max undo stack size (default: 20)
 * @returns {{ push, undo, redo, canUndo, canRedo, undoStack, redoStack, clear }}
 */
export function useUndoStack({ onUndo, onRedo, maxSize = MAX_STACK_SIZE } = {}) {
  const [undoStack, setUndoStack] = useState([])
  const [redoStack, setRedoStack] = useState([])
  const onUndoRef = useRef(onUndo)
  const onRedoRef = useRef(onRedo)

  useEffect(() => { onUndoRef.current = onUndo }, [onUndo])
  useEffect(() => { onRedoRef.current = onRedo }, [onRedo])

  /**
   * Push a new reversible action onto the stack
   * @param {object} action - { type: string, data: any, inverse: any, description?: string }
   */
  const push = useCallback((action) => {
    const entry = {
      ...action,
      timestamp: Date.now(),
    }
    setUndoStack(prev => {
      const next = [entry, ...prev]
      return next.length > maxSize ? next.slice(0, maxSize) : next
    })
    // Clear redo stack on new action (standard undo/redo behavior)
    setRedoStack([])
  }, [maxSize])

  /**
   * Undo the most recent action
   */
  const undo = useCallback(() => {
    setUndoStack(prev => {
      if (prev.length === 0) return prev
      const [latest, ...rest] = prev
      // Move to redo stack
      setRedoStack(redoPrev => [latest, ...redoPrev])
      // Execute the inverse
      queueMicrotask(() => onUndoRef.current?.(latest))
      return rest
    })
  }, [])

  /**
   * Redo the most recently undone action
   */
  const redo = useCallback(() => {
    setRedoStack(prev => {
      if (prev.length === 0) return prev
      const [latest, ...rest] = prev
      // Move back to undo stack
      setUndoStack(undoPrev => [latest, ...undoPrev])
      // Execute the action
      queueMicrotask(() => onRedoRef.current?.(latest))
      return rest
    })
  }, [])

  /**
   * Clear both stacks
   */
  const clear = useCallback(() => {
    setUndoStack([])
    setRedoStack([])
  }, [])

  return {
    push,
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    undoStack,
    redoStack,
    clear,
  }
}

/**
 * useUndoKeyboard — Registers Ctrl+Z / Ctrl+Y keyboard shortcuts
 * @param {function} undo
 * @param {function} redo
 */
export function useUndoKeyboard(undo, redo) {
  useEffect(() => {
    const handler = (e) => {
      // Ignore if user is typing in an input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undo, redo])
}
