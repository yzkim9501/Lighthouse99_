const mongoose=require("mongoose");
const {Schema}=mongoose;
const boardSchema = new Schema({
  boardId:{
    type:Number,
    unique:true
  },
  title:{
    type:String
  },
  content:{
    type:String
  },
  userId:{
    type:Number
  },
  date:{
    type:String
  }
});

module.exports=mongoose.model("Board",boardSchema);