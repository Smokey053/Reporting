const Tag = ({ tone = "neutral", children }) => (
  <span className={`tag tone-${tone}`}>{children}</span>
);

export default Tag;
