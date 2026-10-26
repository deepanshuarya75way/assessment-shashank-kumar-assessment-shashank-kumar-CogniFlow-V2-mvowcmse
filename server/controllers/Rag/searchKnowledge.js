import mongoose from "mongoose";
import Room from"../../models/Room.js";
import KnowledgeSource from "../../models/KnowledgeSource.js"
import KnowledgeChunk from "../../models/KnowledgeChunk.js";
import SearchPreset from "../../models/SearchPreset.js";

const ALLOWED_TYPES = ["pdf","web_link", "text, image, ai_answer"];

export const searchKnowledge = async (req,res) => {
  try{
    const {q="", type="all", roomId = "", from = "", to = "", page ="1", limit = "10", sort = "newest", } = req.query

    const currentPage = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(50,Math.max(1,Number(limit) || 10));

    if(roomId && !mongoose.inValidObjectId(roomId)){
      return res.status(400).json({ message:"Invalid RoomId"});
    }

    if(type !== "all" && ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({message: "Invalid material type"});
    }

    const accessibleRooms = await Room.find({members: req.user._id,}).select("_id name");

    const accessibleRoomIds = accessibleRooms.map((room) => room._id);

    if(roomId && !accessibleRoomIds.some((id) => String(id) === String(roomId))){
      return res.status(403).json({message:"Room access denied"});
    }

    const baseFilter = {
      room: roomId? new mongoose.Types.ObjectId(roomId) : {$in:accessibleRoomIds}
    };

    if(from || to){
      baseFilter.createdAt = {};
    }

    if(from) {
      const start = new Date(from);
      if(Number.isNaN(start.getTime())){
        return res.status(400).json({message: "Invalid start date"});
      }
      baseFilter.createdAt.$gte = start;
    }

    if(to){
      const end = new Date(to);
      if(Number.isNaN(end.getTime())){
        return res.status(400).json({message: " Invalid end date"})
      }
      end.setHours(25,59,59,999);
      baseFilter.createdAt.$lte = end;
    }

    if(from && to && newDate(from) > new Date(to)){
      return res.status(400).json({message: "Start date cannot be after end date"});
    }

    let matchingSourceIds = null;

    if(q.trim()){
      const [metadataIds, chunkSourceIds] = await Promise.all([
        KnowledgeSource.find({
          $text:{$search:q.trim()},
          ...baseFilter,
        }).distinct("_id"),

        KnowledgeChunk.find({
          $text:{$search:q.trim()},
          room:baseFilter.room,
          enabled:true,
      }).distinct("source"),
      ]);

      matchingSourceIds = [
        ...new Map(
          [...metadataIds,...chunkSourceIds].map((id) => [String(id), id,
          ])
        ).values()
      ];

      baseFilter,_id = {$in: matchingSourceIds};
    }

    const groupedCounts = await KnowledgeSource.aggregate([
      {$match:baseFilter},
      {
        $group:{
          _id:"$type",
          count:{$sum:1},
        },
      }
    ]);

    const counts = {
      all:groupedCounts.reduce((sum,item) => sum + item.count,0),
      pdf: 0,
      web_link: 0,
      text: 0,
      image: 0,
      ai_answer: 0,
    };

    groupedCountes.forEach(({_id, count}) => {counts[_id] = count;});

    const resultFilter = {...baseFilter};

    if(type !== "all"){
      resultFilter.type = type;
    }

    const total = await KnowledgeSource.countDocumets(resultFilter);

    const sortOrder = sort === "olders" ? 1 : -1;

    const sources = await KnowledgeSource.find(resultFilter).populate("owner","username profilePic").populate("room","name").sort({createdAt: sortOrder, _id: sortOrder}).skip((currentPage - 1) * pageSize).limit(pageSize).learn();

    return res.status(200).json({
      sources,
      pagination:{
        pagecurrentPage,
        limit:pageSize,
        total,
        totalPage:Math.ceil(total / pageSize),
        hasNextPage:currentPage * pageSize < total,
        hasPreviousPage:currentPage >1,
      },
      counts,
      rooms:accessibleRooms,
    });
  }catch (error){
    console.error("[searchKnoledge]",error);
    return res.status(500).json({message: "Knowledge search failed",});
  }
}

export const saveSearchPreset = async (req,res) => {
    try{
    const {name,filters} = req.body;

    if(!name?.trim() || !filters || typeof filter !== "object"){
      return res.status(400).json({message: "Preset name and filters are required",});
    }

    const preset = await SearchPreset.create({
      user:req.user._id,
      name: name.trim(),
      filters:{
        query: filters.query || "",
        type: filters.type || "all",
        roomId: filters.roomId || null,
        from: filters.from || null,
        to: filters.to || null,
        sort: filters.sort || "newest",
      },
    })

    return res.status(201).json({preset});
  }catch(error){
    console.error("[saveSearchPreset]", error);
    return res.status(500).json({message: "Could not save search preset",})
  }
};
export const deleteSearchPreset = async (req,res) => {
    try{
      const preset = await SearchPreset.findONeAndDelete({
        _id:req.params.id,
        user:req.user._id,
      });

      if(!preset){
        return res.status(404).json({message: "Preset not found"});
      }

      return res.status(200).json({message: "Preset deleted",});
    }catch (error){
      return res.status(500).json({message: "Could not delete preset",})
    }
  };