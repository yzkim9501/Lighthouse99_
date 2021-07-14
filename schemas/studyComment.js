const mongoose=require("mongoose");
const {Schema}=mongoose;
const studyCommentSchema = new Schema({
  studyCommentId:{
    type:Number,
    unique:true
  },
  studyId:{
    type:Number,
  },
  content:{
    type:String,
  },
  userId:{
    type:Number,
  },
  date:{
    type:String,
  }
});

module.exports=mongoose.model("StudyComment",studyCommentSchema);