const mongoose=require("mongoose");
const {Schema}=mongoose;
const studyJoinSchema = new Schema({
  studyId:{
    type:Number
  },
  userId:{
    type:Number
  },
  leader:{
    type:Boolean
  }
});

module.exports=mongoose.model("StudyJoin",studyJoinSchema);