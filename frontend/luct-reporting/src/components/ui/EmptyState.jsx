const EmptyState = ({ title, message, action }) => (
  <div className="empty-state">
    <h4>{title}</h4>
    <p>{message}</p>
    {action}
  </div>
);

export default EmptyState;
