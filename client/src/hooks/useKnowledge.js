import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { getBackendUrl } from "../utils/apiConfig";
import { getAuthToken } from "../utils/authStorage";

const BackendUrl = getBackendUrl();

export const useKnowledge = (arg1, arg2) => {
  const roomId = typeof arg1 === "object" && arg1 !== null ? arg1.roomId : arg1;
  const socket = typeof arg1 === "object" && arg1 !== null ? arg1.socket : arg2;
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ragMode, setRagMode] = useState("strict");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const token = getAuthToken();
  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
  };

  // Fetch sources for current room
  const fetchSources = useCallback(async () => {
    if (!roomId) return;
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${BackendUrl}/api/rag/rooms/${roomId}/sources`,
        authHeaders
      );
      setSources(data.sources || []);
      if (data.mode) {
        setRagMode(data.mode);
      }
    } catch (err) {
      console.error("Error fetching knowledge sources:", err);
    } finally {
      setLoading(false);
    }
  }, [roomId, token]);

  // Upload file source
  const uploadSource = async (file) => {
    if (!roomId || !file) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("roomId", roomId);

      const { data } = await axios.post(`${BackendUrl}/api/rag/sources`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setUploadProgress(percentCompleted);
        },
      });

      if (data.alreadyExists) {
        toast(`"${file.name}" is already in knowledge base and ready!`, { icon: "✅" });
      } else {
        toast(`"${file.name}" uploaded, processing knowledge...`, { icon: "📄" });
      }

      // Optimistically add or update source
      setSources((prev) => [data.source, ...prev.filter((s) => s._id !== data.source._id)]);
      return data.source;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to upload file";
      toast.error(msg);
      throw err;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Upload text note
  const uploadText = async (title, text) => {
    if (!roomId || !text) return;
    try {
      setIsUploading(true);
      const { data } = await axios.post(
        `${BackendUrl}/api/rag/sources/text`,
        { roomId, title, text },
        authHeaders
      );
      toast("Text note added, processing knowledge...", { icon: "📝" });
      setSources((prev) => [data.source, ...prev.filter((s) => s._id !== data.source._id)]);
      return data.source;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to add text note";
      toast.error(msg);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  // Toggle source enabled
  const toggleSource = async (sourceId, enabled) => {
    try {
      // Optimistic update
      setSources((prev) =>
        prev.map((s) => (s._id === sourceId ? { ...s, enabled } : s))
      );

      const { data } = await axios.patch(
        `${BackendUrl}/api/rag/sources/${sourceId}`,
        { enabled },
        authHeaders
      );

      return data.source;
    } catch (err) {
      toast.error("Failed to toggle source");
      fetchSources();
    }
  };

  // Delete source
  const deleteSource = async (sourceId) => {
    try {
      setSources((prev) => prev.filter((s) => s._id !== sourceId));
      await axios.delete(`${BackendUrl}/api/rag/sources/${sourceId}`, authHeaders);
      toast.success("Knowledge source deleted");
    } catch (err) {
      toast.error("Failed to delete source");
      fetchSources();
    }
  };

  // Update room RAG mode
  const updateMode = async (mode) => {
    try {
      setRagMode(mode);
      await axios.patch(
        `${BackendUrl}/api/rag/rooms/${roomId}/settings`,
        { mode },
        authHeaders
      );
      toast.success(`Knowledge mode set to ${mode === "strict" ? "Docs only" : mode === "hybrid" ? "Docs + General" : "Off"}`);
    } catch (err) {
      toast.error("Failed to update mode");
      fetchSources();
    }
  };

  // Request general fallback answer
  const answerGeneral = async (messageId) => {
    try {
      const { data } = await axios.post(
        `${BackendUrl}/api/rag/messages/${messageId}/answer-general`,
        {},
        authHeaders
      );
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to get general answer";
      toast.error(msg);
      throw err;
    }
  };

  // Learn from AI answer
  const learnFromAnswer = async (messageId, { question, answer }) => {
    try {
      const { data } = await axios.post(
        `${BackendUrl}/api/rag/messages/${messageId}/learn`,
        { question, answer },
        authHeaders
      );
      toast.success("Answer added to chat knowledge base!");
      if (data.source) {
        setSources((prev) => [data.source, ...prev.filter((s) => s._id !== data.source._id)]);
      }
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to learn from answer";
      toast.error(msg);
      throw err;
    }
  };

  // Listen to live socket events
  useEffect(() => {
    if (!socket || !roomId) return;

    const handleStatus = (payload) => {
      if (String(payload.roomId) === String(roomId)) {
        setSources((prev) => {
          const index = prev.findIndex((s) => s._id === payload.sourceId);
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = {
              ...updated[index],
              status: payload.status,
              chunkCount: payload.chunkCount ?? updated[index].chunkCount,
              pageCount: payload.pageCount ?? updated[index].pageCount,
              error: payload.error ?? null,
              enabled: payload.enabled !== undefined ? payload.enabled : updated[index].enabled,
            };
            return updated;
          } else {
            // New source
            fetchSources();
            return prev;
          }
        });

        if (payload.status === "ready") {
          toast.success("Document processed and ready for CogniBot!");
        } else if (payload.status === "failed") {
          toast.error(`Processing failed: ${payload.error || "Unknown error"}`);
        }
      }
    };

    const handleRemoved = ({ sourceId, roomId: removedRoomId }) => {
      if (String(removedRoomId) === String(roomId)) {
        setSources((prev) => prev.filter((s) => s._id !== sourceId));
      }
    };

    const handleMode = ({ roomId: modeRoomId, mode }) => {
      if (String(modeRoomId) === String(roomId)) {
        setRagMode(mode);
      }
    };

    socket.on("knowledge:status", handleStatus);
    socket.on("knowledge:removed", handleRemoved);
    socket.on("room:rag-mode", handleMode);

    return () => {
      socket.off("knowledge:status", handleStatus);
      socket.off("knowledge:removed", handleRemoved);
      socket.off("room:rag-mode", handleMode);
    };
  }, [socket, roomId, fetchSources]);

  // Initial fetch on room change
  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const readySourcesCount = sources.filter((s) => s.status === "ready" && s.enabled).length;

  // Generate interactive document quiz
  const generateQuiz = async (topic = "", numQuestions = 5) => {
    if (!roomId) return;
    try {
      toast("Generating quiz from documents...", { icon: "🎯" });
      const { data } = await axios.post(
        `${BackendUrl}/api/rag/rooms/${roomId}/quiz`,
        { topic, numQuestions },
        authHeaders
      );
      toast.success("Document quiz ready!");
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to generate quiz. Please ensure documents are uploaded.";
      toast.error(msg);
      throw err;
    }
  };

  return {
    sources,
    loading,
    ragMode,
    isUploading,
    uploadProgress,
    readySourcesCount,
    uploadSource,
    uploadText,
    toggleSource,
    deleteSource,
    updateMode,
    answerGeneral,
    learnFromAnswer,
    generateQuiz,
    refreshSources: fetchSources,
  };
};

export default useKnowledge;
