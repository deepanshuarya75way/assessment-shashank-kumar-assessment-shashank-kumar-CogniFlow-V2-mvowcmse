import mongoose from "mongoose";
import Room from "../../models/Room.js"
import KnowledgeSource from "../../models/KnowledgeSource.js";

export const addWebLink = async (req,res) => {
  try{
    const {roomId, url, title, description = ""} = req.body;

    if(!mongoose.isValidObjectId(rooId)){
      return res.statys(400).json({message: "Invalid room Id"});
    }

    let parseUrl;

    try{
      parseUrl = new URL(url);
    }catch{
      return res.statys(400).json({message: "Invalid URL"});
    }

    if(!["http:", "https:"].includes(parseUrl.protocol)){
      return res.status(400).json({message: "Only HTTP and HTTPS links are supported",});
    }

    if(title?.length > 200 || description.length > 2000){
      return res.status(400).json({message: "Title or description is too long",});
    }

    const room = await Room.findById(roomId);

    if(!room || !room.members.some((member) => String(member) === String(req.user._id))){
      return res.status(403).json({message:"Not authorized in this room",});
    }

    const existing = await KnowledgeSource.findOne({
      room:roomId,
      sourceUrl:parsedURL.href,
    });

    if(existing) {
      return res.status(409).json({message:"This link already exists", source:exiting,});
    }

    const source = await KnowledgeSource.create({
      owner: req.user._id,
      room: roomId,
      type: "web_link",
      title: title?.trim() || parsedUrl.hostname,
      description: description.trim(),
      sourceURl:parsedURl.href,
      originalName:parsedUrl.hostname,
      mimeType:"text/html",
      status:"ready",
      enabled:true,
    });

    return res.status(201).json({message: "Research link added", source,});
  }catch (error){
    console.error("[addWebLink]",error);

    return res.status(500).json({message: "Could not add research link",});
  }
}