const InputGroup = ({
  label,
  hint,
  error,
  as = "input",
  className = "",
  children,
  ...rest
}) => {
  const Component =
    as === "textarea" || as === "select" || as === "input" ? as : "input";

  return (
    <label className={`input-group${error ? " has-error" : ""}`}>
      {label && <span className="input-label">{label}</span>}
      {Component === "select" ? (
        <select className={`input-control ${className}`.trim()} {...rest}>
          {children}
        </select>
      ) : Component === "textarea" ? (
        <textarea className={`input-control ${className}`.trim()} {...rest} />
      ) : (
        <input className={`input-control ${className}`.trim()} {...rest} />
      )}
      {hint && <span className="input-hint">{hint}</span>}
      {error && <span className="input-error">{error}</span>}
    </label>
  );
};

export default InputGroup;
