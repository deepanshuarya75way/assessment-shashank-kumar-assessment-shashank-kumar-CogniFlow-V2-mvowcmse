
import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Link as LinkIcon,
  Save,
  Trash2,
  RefreshCw,
} from "lucide-react";

import { getBackendUrl } from "../../utils/apiConfig";
import { getAuthToken } from "../../utils/authStorage";
import SourceItem from "./SourceItem";

const API = getBackendUrl();

const TYPES = [
  { value: "all", label: "All" },
  { value: "pdf", label: "PDFs" },
  { value: "text", label: "Notes" },
  { value: "web_link", label: "Web Links" },
  { value: "image", label: "Images" },
  { value: "ai_answer", label: "AI Answers" },
];

const getInitialFilters = (roomId) => {
  const params = new URLSearchParams(window.location.search);

  return {
    q: params.get("q") || "",
    type: params.get("type") || "all",
    roomId:roomId || params.get("roomId") || "",
    from: params.get("from") || "",
    to: params.get("to") || "",
    sort: params.get("sort") || "newest",
  };
};

const KnowledgeExplorer = ({
  roomId,
  onToggle,
  onDelete,
}) => {
  const [filters, setFilters] = useState(() =>
    getInitialFilters(roomId)
  );

  const [debouncedQuery, setDebouncedQuery] = useState(filters.q);
  const [sources, setSources] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [counts, setCounts] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 0,
  });

  const [presets, setPresets] = useState([]);
  const [presetName, setPresetName] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");

  const [loading, setLoading] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkDescription, setLinkDescription] = useState("");
  const [addingLink, setAddingLink] = useState(false);

  const token = getAuthToken();

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(filters.q);
    }, 400);

    return () => clearTimeout(timer);
  }, [filters.q]);

  useEffect(() => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    const query = params.toString();
    const newUrl = query
      ? `${window.location.pathname}?${query}`
      : window.location.pathname;

    window.history.replaceState({}, "", newUrl);
  }, [filters]);

  const fetchKnowledge = async () => {
    try {
      setLoading(true);

      const { data } = await axios.get(
        `${API}/api/rag/knowledge/search`,
        {
          ...authConfig,
          params: {
            ...filters,
            q: debouncedQuery,
            page: pagination.page,
            limit: 10,
          },
        }
      );

      setSources(data.sources || []);
      setCounts(data.counts || {});
      setRooms(data.rooms || []);
      setPagination((previous) => ({
        ...previous,
        ...data.pagination,
      }));
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Search failed"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if(!debouncedQuery.trim()){
      setSources([]);
      setCounts({});
      setPagination({
        page:1,
        total:0,
        totalPages:0,
      });
      return;
    }
    fetchKnowledge();
  }, [
    debouncedQuery,
    filters.type,
    filters.roomId,
    filters.from,
    filters.to,
    filters.sort,
    pagination.page,
  ]);

  const fetchPresets = async () => {
    try {
      const { data } = await axios.get(
        `${API}/api/rag/search-presets`,
        authConfig
      );

      setPresets(data.presets || []);
    } catch {
      toast.error("Could not load saved searches");
    }
  };

  useEffect(() => {
    fetchPresets();
  }, []);

  const updateFilter = (key, value) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
    }));

    setPagination((previous) => ({
      ...previous,
      page: 1,
    }));
  };

  const savePreset = async () => {
    if (!presetName.trim()) {
      return toast.error("Enter a preset name");
    }

    try {
      await axios.post(
        `${API}/api/rag/search-presets`,
        {
          name: presetName.trim(),
          filters: {
            query: filters.q,
            type: filters.type,
            roomId: filters.roomId || null,
            from: filters.from || null,
            to: filters.to || null,
            sort: filters.sort,
          },
        },
        authConfig
      );

      toast.success("Search preset saved");
      setPresetName("");
      fetchPresets();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not save preset"
      );
    }
  };

  const applyPreset = (id) => {
    setSelectedPreset(id);

    const preset = presets.find((item) => item._id === id);
    if (!preset) return;

    const saved = preset.filters;

    setFilters({
      q: saved.query || "",
      type: saved.type || "all",
      roomId: saved.roomId || "",
      from: saved.from
        ? new Date(saved.from).toISOString().slice(0, 10)
        : "",
      to: saved.to
        ? new Date(saved.to).toISOString().slice(0, 10)
        : "",
      sort: saved.sort || "newest",
    });

    setPagination((previous) => ({
      ...previous,
      page: 1,
    }));
  };

  const deletePreset = async (id) => {
    try {
      await axios.delete(
        `${API}/api/rag/search-presets/${id}`,
        authConfig
      );

      setPresets((previous) =>
        previous.filter((item) => item._id !== id)
      );

      if (selectedPreset === id) setSelectedPreset("");

      toast.success("Preset deleted");
    } catch {
      toast.error("Could not delete preset");
    }
  };

  const addResearchLink = async (event) => {
    event.preventDefault();

    if (!roomId) {
      return toast.error("Open a room before adding a link");
    }

    if (!linkUrl.trim()) {
      return toast.error("Enter a URL");
    }

    try {
      setAddingLink(true);

      await axios.post(
        `${API}/api/rag/sources/link`,
        {
          roomId,
          url: linkUrl.trim(),
          title: linkTitle.trim(),
          description: linkDescription.trim(),
        },
        authConfig
      );

      toast.success("Research link added");

      setLinkUrl("");
      setLinkTitle("");
      setLinkDescription("");

      setFilters((previous) => ({
        ...previous,
        roomId,
        type: "all",
        q: "",
      }));

      setDebouncedQuery("");
      setPagination((previous) => ({
        ...previous,
        page: 1,
      }));

    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not add link"
      );
    } finally {
      setAddingLink(false);
    }
  };

  const handleToggle = async (id, enabled) => {
    await onToggle?.(id, enabled);
    fetchKnowledge();
  };

  const handleDelete = async (id) => {
    await onDelete?.(id);
    fetchKnowledge();
  };

  return (
    <div className="flex flex-col gap-4">

      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          value={filters.q}
          onChange={(e) => updateFilter("q", e.target.value)}
          placeholder="Search documents, notes and links..."
          className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs bg-[var(--card)] border border-slate-200 dark:border-slate-700 text-[var(--text)] outline-none focus:border-blue-500"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {TYPES.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => updateFilter("type", item.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
              filters.type === item.value
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-[var(--card)] text-[var(--text-muted)] border-slate-200 dark:border-slate-700"
            }`}
          >
            {item.label}
            <span className="ml-1.5 opacity-75">
              {counts[item.value] ?? 0}
            </span>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <select
          value={filters.roomId}
          onChange={(e) => updateFilter("roomId", e.target.value)}
          className="p-2 rounded-lg text-xs bg-[var(--card)] border border-slate-200 dark:border-slate-700 text-[var(--text)]"
        >
          <option value="">All rooms</option>
          {rooms.map((room) => (
            <option key={room._id} value={room._id}>
              {room.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={filters.from}
          onChange={(e) => updateFilter("from", e.target.value)}
          className="p-2 rounded-lg text-xs bg-[var(--card)] border border-slate-200 dark:border-slate-700 text-[var(--text)]"
        />

        <input
          type="date"
          value={filters.to}
          onChange={(e) => updateFilter("to", e.target.value)}
          className="p-2 rounded-lg text-xs bg-[var(--card)] border border-slate-200 dark:border-slate-700 text-[var(--text)]"
        />

        <select
          value={filters.sort}
          onChange={(e) => updateFilter("sort", e.target.value)}
          className="p-2 rounded-lg text-xs bg-[var(--card)] border border-slate-200 dark:border-slate-700 text-[var(--text)]"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={selectedPreset}
          onChange={(e) => applyPreset(e.target.value)}
          className="flex-1 min-w-0 p-2 rounded-lg text-xs bg-[var(--card)] border border-slate-200 dark:border-slate-700 text-[var(--text)]"
        >
          <option value="">Saved searches</option>
          {presets.map((preset) => (
            <option key={preset._id} value={preset._id}>
              {preset.name}
            </option>
          ))}
        </select>

        {selectedPreset && (
          <button
            type="button"
            onClick={() => deletePreset(selectedPreset)}
            className="p-2 rounded-lg text-red-500 border border-red-200"
            title="Delete preset"
          >
            <Trash2 size={15} />
          </button>
        )}

        <input
          value={presetName}
          onChange={(e) => setPresetName(e.target.value)}
          placeholder="Preset name"
          className="min-w-0 flex-1 p-2 rounded-lg text-xs bg-[var(--card)] border border-slate-200 dark:border-slate-700 text-[var(--text)]"
        />

        <button
          type="button"
          onClick={savePreset}
          className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs flex items-center gap-1"
        >
          <Save size={14} /> Save
        </button>
      </div>

      {roomId && (
        <form
          onSubmit={addResearchLink}
          className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-[var(--card)] flex flex-col gap-2"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--text)]">
            <LinkIcon size={15} />
            Add research link
          </div>

          <input
            type="url"
            required
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com/article"
            className="p-2 rounded-lg text-xs bg-[var(--bg-input)] border border-slate-200 dark:border-slate-700 text-[var(--text)]"
          />

          <input
            value={linkTitle}
            onChange={(e) => setLinkTitle(e.target.value)}
            placeholder="Title (optional)"
            className="p-2 rounded-lg text-xs bg-[var(--bg-input)] border border-slate-200 dark:border-slate-700 text-[var(--text)]"
          />

          <input
            value={linkDescription}
            onChange={(e) => setLinkDescription(e.target.value)}
            placeholder="Description (optional)"
            className="p-2 rounded-lg text-xs bg-[var(--bg-input)] border border-slate-200 dark:border-slate-700 text-[var(--text)]"
          />

          <button
            type="submit"
            disabled={addingLink}
            className="self-end px-3 py-2 rounded-lg bg-blue-600 text-white text-xs disabled:opacity-50"
          >
            {addingLink ? "Adding..." : "Add link"}
          </button>
        </form>
      )}
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-[var(--text)]">
          {debouncedQuery.trim() ? `Search results ({pagination.total || 0})` : "Enter a search term to find knowledge"}
        </p>

        <button
          type="button"
          onClick={fetchKnowledge}
          className="text-slate-400 hover:text-blue-500"
          title="Refresh"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-400">
          Searching knowledge base...
        </div>
      ) : sources.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          No matching knowledge sources found.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sources.map((source) => (
            <SourceItem
              key={source._id}
              source={source}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
        <span className="text-xs text-slate-400">
          Page {pagination.page || 1} of {pagination.totalPages || 1}
        </span>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={!pagination.hasPreviousPage || loading}
            onClick={() =>
              setPagination((previous) => ({
                ...previous,
                page: previous.page - 1,
              }))
            }
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
          >
            <ChevronLeft size={15} />
          </button>

          <button
            type="button"
            disabled={!pagination.hasNextPage || loading}
            onClick={() =>
              setPagination((previous) => ({
                ...previous,
                page: previous.page + 1,
              }))
            }
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeExplorer;
