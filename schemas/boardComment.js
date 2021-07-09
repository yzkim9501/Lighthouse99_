const mongoose=require("mongoose");
const {Schema}=mongoose;
const boardCommentSchema = new Schema({
  boardCommentId:{
    type:Number,
    unique:true
  },
  boardId:{
    type:Number,
  },
  content:{
    type:String,
  },
  userId:{
    type:String,
  },
  date:{
    type:String,
  }
});

module.exports=mongoose.model("BoardComment",boardCommentSchema);