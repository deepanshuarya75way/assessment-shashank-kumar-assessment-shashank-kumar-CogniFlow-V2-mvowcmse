const LogoutButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-red-500/90 hover:text-red-600
      bg-red-500/5 hover:bg-red-500/10 border border-red-500/15 hover:border-red-500/25
      shadow-[0_1px_2px_rgba(239,68,68,0.05)]
      hover:-translate-y-[1px]
      transition-all duration-200
      active:scale-[0.98]
      cursor-pointer"
    >
      Logout
    </button>
  );
};

export default LogoutButton;