/* ConfirmDialog.jsx — Confirmation dialog for destructive actions */
import Modal from './Modal.jsx'

export default function ConfirmDialog({ isOpen, onConfirm, onCancel, title, message }) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title || 'Confirmar'}>
      <p style={{ margin: '16px 0', color: 'var(--text-secondary)' }}>{message}</p>
      <div className="flex gap-sm" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-danger" onClick={onConfirm}>Confirmar</button>
      </div>
    </Modal>
  )
}
