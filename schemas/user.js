const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  userId:{
    type:Number,
    unique:true
  },
  group:{
    type:Number,
  },
  email:{
    type:String,
  },
  nickname:{
    type:String,
  },
  password:{
    type:String,
  },
});
module.exports = mongoose.model("User", UserSchema);