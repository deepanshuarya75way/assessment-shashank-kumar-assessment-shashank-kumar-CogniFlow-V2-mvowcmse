const Button = ({ children, className = "", variant = "primary", ...props }) => {
  const isSecondary = variant === "secondary";

  return (
    <button
      {...props}
      className={`
        w-full h-[44px] px-4 rounded-[10px] text-[15px] font-semibold
        transition-all duration-150 ease-out
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2
        cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
        ${
          isSecondary
            ? "bg-transparent text-[var(--text-primary)] border border-[var(--border-strong)] hover:bg-[var(--bg-hover)]"
            : "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] active:scale-[0.99]"
        }
        ${className}
      `}
    >
      {children}
    </button>
  );
};

export default Button;
