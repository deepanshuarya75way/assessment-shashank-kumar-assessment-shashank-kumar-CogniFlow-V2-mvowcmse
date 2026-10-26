import React from "react";
import { Search, ArrowLeft } from "lucide-react";

const SearchBar = ({ search, setSearch, setSearchResult, handleSearch }) => {
  return (
    <div className="px-3 py-2 border-b border-[var(--border)] bg-[var(--bg-panel)] flex items-center">
      <div className="relative flex items-center w-full">
        {search ? (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSearchResult([]);
            }}
            className="absolute left-2.5 text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors z-10 cursor-pointer"
            aria-label="Clear search"
          >
            <ArrowLeft size={18} />
          </button>
        ) : (
          <Search
            size={18}
            className="absolute left-2.5 text-[var(--text-tertiary)] pointer-events-none"
          />
        )}

        <input
          type="text"
          placeholder="Search or start a new chat"
          value={search}
          onChange={handleSearch}
          className="w-full h-9 pl-9 pr-3 rounded-[8px] bg-[var(--bg-input)] text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none border border-transparent focus:border-[var(--border-strong)] focus:bg-[var(--bg-panel)] transition-all duration-150"
        />
      </div>
    </div>
  );
};

export default SearchBar;
