export default function Modal({ title, kicker, onClose, children, wide = false }) {
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <button className="modal-close" type="button" onClick={onClose} aria-label="Close">×</button>
        {kicker && <div className="modal-kicker">{kicker}</div>}
        <h3>{title}</h3>
        {children}
      </section>
    </div>
  );
}
