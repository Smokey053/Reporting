import clsx from "clsx";

const StatCard = ({ label, value, hint, icon: Icon, tone = "primary" }) => (
  <article className={clsx("stat-card", `tone-${tone}`)}>
    <div className="stat-content">
      <p className="stat-label">{label}</p>
      <h2 className="stat-value">{value}</h2>
      {hint && <p className="stat-hint">{hint}</p>}
    </div>
    {Icon && (
      <div className="stat-icon">
        <Icon size={28} />
      </div>
    )}
  </article>
);

export default StatCard;
