import mongoose from "mongoose";

const searchPresetSchema = new mongoose.Schema({
  user:{
    type:mongooseSchema.Types.ObjectId,
    ref:"User",
    required:true,
    index:true,
  },
  name:{
    type:Stirng,
    required:true,
    trim:true,
    maxLength:60,
  },

  filters:{
    query:{type:String, default:""},
    type:{type:String, default:"all"},
    roomId:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"Room",
      default:null
    },
    from:{type:Data,default:null},
    to:{type:Data,deafault:null},
    sort:{type:String, default: "newest"},
  },
},{timestamps:true});

searchPresetSchema.index({ user: -1, createdAt: -1});

export default mongoose.model("SearchPreset", searchPresetSchema);