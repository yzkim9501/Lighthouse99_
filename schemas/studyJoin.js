const mongoose=require("mongoose");
const {Schema}=mongoose;
const studyJoinSchema = new Schema({
  studyId:{
    type:Number
  },
  userId:{
    type:Number
  },
  userName:{
    type:String
  },
  leader:{
    type:Boolean
  }
});

module.exports=mongoose.model("StudyJoin",studyJoinSchema);