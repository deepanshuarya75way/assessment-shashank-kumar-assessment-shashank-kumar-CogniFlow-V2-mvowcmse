import mongoose from "mongoose";
import Room from "../../models/Room.js";
import KnowledgeSource from "../../models/KnowledgeSource.js";
import KnowledgeChunk from "../../models/KnowledgeChunk.js";
import SearchPreset from "../../models/SearchPreset.js";

const ALLOWED_TYPES = ["pdf", "web_link", "text", "image", "ai_answer"];

export const searchKnowledge = async (req, res) => {
  try {
    const {
      q = "",
      type = "all",
      roomId = "",
      from = "",
      to = "",
      page = "1",
      limit = "10",
      sort = "newest",
    } = req.query;

    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

    if (type !== "all" && !ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({ message: "Invalid material type" });
    }

    if (roomId && !mongoose.isValidObjectId(roomId)) {
      return res.status(400).json({ message: "Invalid room ID" });
    }

    const accessibleRooms = await Room.find({
      members: req.user._id,
    }).select("_id name");

    const accessibleRoomIds = accessibleRooms.map((room) => room._id);

    if (
      roomId &&
      !accessibleRoomIds.some((id) => String(id) === String(roomId))
    ) {
      return res.status(403).json({ message: "Room access denied" });
    }

    const baseFilter = {
      room: roomId
        ? new mongoose.Types.ObjectId(roomId)
        : { $in: accessibleRoomIds },
    };

    if (from || to) {
      baseFilter.createdAt = {};

      if (from) {
        const start = new Date(from);
        if (Number.isNaN(start.getTime())) {
          return res.status(400).json({ message: "Invalid start date" });
        }
        start.setHours(0, 0, 0, 0);
        baseFilter.createdAt.$gte = start;
      }

      if (to) {
        const end = new Date(to);
        if (Number.isNaN(end.getTime())) {
          return res.status(400).json({ message: "Invalid end date" });
        }
        end.setHours(23, 59, 59, 999);
        baseFilter.createdAt.$lte = end;
      }

      if (
        baseFilter.createdAt.$gte &&
        baseFilter.createdAt.$lte &&
        baseFilter.createdAt.$gte > baseFilter.createdAt.$lte
      ) {
        return res.status(400).json({
          message: "Start date cannot be after end date",
        });
      }
    }

    let searchFilter = { ...baseFilter };

    if (q.trim()) {
      const [metadataIds, chunkSourceIds] = await Promise.all([
        KnowledgeSource.find({
          ...baseFilter,
          $text: { $search: q.trim() },
        }).distinct("_id"),

        KnowledgeChunk.find({
          room: baseFilter.room,
          enabled: true,
          $text: { $search: q.trim() },
        }).distinct("source"),
      ]);

      const matchingIds = [
        ...new Map(
          [...metadataIds, ...chunkSourceIds].map((id) => [
            String(id),
            id,
          ])
        ).values(),
      ];

      searchFilter._id = { $in: matchingIds };
    }

    // Counts use the search and date filters, but not the selected type.
    const groupedCounts = await KnowledgeSource.aggregate([
      { $match: searchFilter },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
    ]);

    const counts = {
      all: 0,
      pdf: 0,
      web_link: 0,
      text: 0,
      image: 0,
      ai_answer: 0,
    };

    groupedCounts.forEach(({ _id, count }) => {
      counts[_id] = count;
      counts.all += count;
    });

    const resultFilter = { ...searchFilter };

    if (type !== "all") {
      resultFilter.type = type;
    }

    const total = await KnowledgeSource.countDocuments(resultFilter);
    const sortOrder = sort === "oldest" ? 1 : -1;

    const sources = await KnowledgeSource.find(resultFilter)
      .populate("owner", "username profilePic")
      .populate("room", "name")
      .sort({ createdAt: sortOrder, _id: sortOrder })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize)
      .lean();

    const totalPages = Math.ceil(total / pageSize);

    return res.status(200).json({
      sources,
      counts,
      rooms: accessibleRooms,
      pagination: {
        page: currentPage,
        limit: pageSize,
        total,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },
    });
  } catch (error) {
    console.error("[searchKnowledge]", error);
    return res.status(500).json({
      message: "Knowledge search failed",
    });
  }
};

export const saveSearchPreset = async (req, res) => {
  try {
    const { name, filters } = req.body;

    if (
      !name?.trim() ||
      !filters ||
      typeof filters !== "object" ||
      Array.isArray(filters)
    ) {
      return res.status(400).json({
        message: "Preset name and filters are required",
      });
    }

    if (filters.roomId && !mongoose.isValidObjectId(filters.roomId)) {
      return res.status(400).json({ message: "Invalid room ID" });
    }

    const preset = await SearchPreset.create({
      user: req.user._id,
      name: name.trim(),
      filters: {
        query: filters.query || "",
        type: filters.type || "all",
        roomId: filters.roomId || null,
        from: filters.from || null,
        to: filters.to || null,
        sort: filters.sort || "newest",
      },
    });

    return res.status(201).json({ preset });
  } catch (error) {
    console.error("[saveSearchPreset]", error);
    return res.status(500).json({
      message: "Could not save search preset",
    });
  }
};

export const getSearchPresets = async (req, res) => {
  try {
    const presets = await SearchPreset.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({ presets });
  } catch (error) {
    console.error("[getSearchPresets]", error);
    return res.status(500).json({
      message: "Could not fetch search presets",
    });
  }
};

export const deleteSearchPreset = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid preset ID" });
    }

    const preset = await SearchPreset.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!preset) {
      return res.status(404).json({ message: "Preset not found" });
    }

    return res.status(200).json({ message: "Preset deleted" });
  } catch (error) {
    console.error("[deleteSearchPreset]", error);
    return res.status(500).json({
      message: "Could not delete preset",
    });
  }
};