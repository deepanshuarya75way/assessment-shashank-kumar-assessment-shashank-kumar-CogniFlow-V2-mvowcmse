const Input = ({ className = "", ...props }) => {
  return (
    <input
      {...props}
      className={`
        w-full h-[44px] px-3.5 rounded-[10px] outline-none bg-[var(--bg-input)] text-[14px] text-[var(--text-primary)]
        border border-[var(--border)]
        focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]
        transition-all duration-150
        placeholder:text-[var(--text-tertiary)]
        ${className}
      `}
    />
  );
};

export default Input;