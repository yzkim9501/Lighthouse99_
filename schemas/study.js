const mongoose=require("mongoose");
const { Schema }=mongoose;
const studySchema = new Schema({
  studyId:{
    type:Number,
    unique:true
  },
  name:{
    type:String,
  },
  schedule:{
    type:String,
  },
  startDate:{
    type:String,
  },
  endJoinDate:{
    type:String,
  },
  writeDate:{
    type:String,
  },
  size:{
    type:Number,
  },
  explain:{
    type:String,
  },
  joinLater:{
    type:Boolean,
  },
  userId:{
    type:Number,
  },
  level:{
    type:Number,
  },
  studyType:{
    type:Number,
  },
  joinNum:{
    type:Number,
  }
});

module.exports=mongoose.model("Study",studySchema);