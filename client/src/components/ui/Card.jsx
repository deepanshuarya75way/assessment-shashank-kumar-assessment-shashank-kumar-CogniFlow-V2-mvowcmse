const Card = ({ children, className = "" }) => {
  return (
    <div
      className={`
        p-6 sm:p-8 rounded-[12px] bg-[var(--bg-panel)] border border-[var(--border)]
        shadow-[var(--shadow-md)]
        transition-all duration-150
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;
