const MUTED_PALETTE = [
  "#5B7083",
  "#62727B",
  "#546E7A",
  "#5C6F84",
  "#657786",
  "#6B7280",
  "#78909C",
  "#52606D",
];

const getColorForText = (str = "") => {
  if (!str) return MUTED_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % MUTED_PALETTE.length;
  return MUTED_PALETTE[index];
};

const Avatar = ({ text, src, size = "w-10 h-10", className = "" }) => {
  const bgColor = !src && text ? getColorForText(text) : undefined;

  return (
    <div
      className={`${size} rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 border border-[var(--border)] select-none ${className}`}
      style={bgColor ? { backgroundColor: bgColor } : undefined}
    >
      {src ? (
        <img src={src} alt="avatar" className="w-full h-full object-cover" />
      ) : (
        <span className="font-semibold text-white text-[14px] uppercase">
          {text ? text.charAt(0) : ""}
        </span>
      )}
    </div>
  );
};

export default Avatar;
