const Card = ({ title, action, children, subtle, className = "", ...rest }) => (
  <section
    className={`ui-card${subtle ? " is-subtle" : ""} ${className}`.trim()}
    {...rest}
  >
    {(title || action) && (
      <header className="ui-card__header">
        <h3>{title}</h3>
        {action}
      </header>
    )}
    <div className="ui-card__body">{children}</div>
  </section>
);

export default Card;
