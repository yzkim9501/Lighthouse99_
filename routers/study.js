const express = require("express");
const router = express.Router();//라우터라고 선언한다.
const Study = require("../schemas/study");
const StudyComment = require("../schemas/studyComment");
const StudyJoin = require("../schemas/studyJoin");

router.get("/study", async (req, res, next) => {
    try {
      const studys = await Post.find({ }).sort("-date");
      res.json({ studys: studys });
    } catch (err) {
      console.error(err);
      next(err);
    }
});

router.post("/study",async(req,res)=>{
    const recentStudy = await Study.find().sort("-studyId").limit(1);
    let studyId=1;
    if(recentStudy.length!=0){
        studyId=recentStudy[0]['postId']+1
    }
    const { name,schedule,startDate,endJoinDate,writeDate,size,explain,joinLater,userId,level,studyType,joinNum } = req.body;
    const writeDate=(new Date().format("yyyy-MM-dd a/p hh:mm:ss"))
    await Study.create({ studyId,name,schedule,startDate,endJoinDate,writeDate,size,explain,joinLater,userId,level,studyType,joinNum});
    res.send({ result: "success" });
})

router.get("/study/:studyId", async (req, res) => {
const { studyId } = req.params;
studyDetail = await Study.find({ studyId });
res.send({ detail: studyDetail });
})

router.patch("/study/:studyId", async (req, res) => {
    const { studyId } = req.params;
    const {name,schedule,startDate,endJoinDate,writeDate,size,explain,joinLater,userId,level,studyType,joinNum} = req.body;
    await Post.updateOne({ studyId }, { $set: { name,schedule,startDate,endJoinDate,writeDate,size,explain,joinLater,userId,level,studyType,joinNum } });
    res.send({ result: "success" });
  })

router.delete("/study/:studyId", async (req, res) => {
    const { studyId } = req.params;
    await Study.deleteOne({ studyId });
    res.send({ result: "success" });
});

router.get("/join-study/:studyId", async (req, res) => {
    try {
        const { studyId } = req.params;
        const { userId,leader} = req.body;
        await StudyJoin.create({ studyId,userId,userName,leader });
        studyMemberInfo=await StudyJoin.find({studyId})
        res.send({"currentMemberCnt":studyMemberInfo.length,"studyMemberInfo":studyMemberInfo})
    } catch (err) {
      console.error(err);
      next(err);
    }
});

//해당 포스트의 모든 댓글 조회
router.get("/study-all-comment/:studyId", async (req, res) => {
    try {
      const { studyId } = req.params;
      let comments = await StudyComment.find({ studyId }).sort("-date");
      res.json({ comments: comments });
    } catch (err) {
      console.error(err);
      next(err);
    }
  });
  
  //댓글 한개 조회
  router.get("/study-comment/:commentId", async (req, res) => {
    const { commentId } = req.params;
    comment = await StudyComment.findOne({ commentId });
    res.json({ detail: comment });
  });
  
  //댓글 게시
  router.post('/study-comment', async (req, res) => {
    const recentComment = await StudyComment.find().sort("-commentId").limit(1);
    let commentId=1;
    if(recentComment.length!=0){
      commentId=recentComment[0]['commentId']+1
    }
    const { userId, postId, content} = req.body;
    const date=(new Date().format("yyyy-MM-dd a/p hh:mm:ss"))
    await StudyComment.create({ commentId, postId, content, userId, date });
    res.send({ result: "success" });
  });
  
  //댓글 삭제
  router.delete("/study-comment/:commentId", async (req, res) => {
    const { commentId } = req.params;
      await StudyComment.deleteOne({ commentId });
      res.send({ result: "success" });
  });
  
  //댓글 수정
    router.patch("/study-comment/:commentId", async (req, res) => {
    const { commentId } = req.params;
      const { content} = req.body;
      await StudyComment.updateOne({ commentId }, { $set: {content } });
      res.send({ result: "success" });
    })

module.exports = router;
Date.prototype.format = function(f) {
    if (!this.valueOf()) return " ";
  
    var weekName = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
    var d = this;
     
    return f.replace(/(yyyy|yy|MM|dd|E|hh|mm|ss|a\/p)/gi, function($1) {
        switch ($1) {
            case "yyyy": return d.getFullYear();
            case "yy": return (d.getFullYear() % 1000).zf(2);
            case "MM": return (d.getMonth() + 1).zf(2);
            case "dd": return d.getDate().zf(2);
            case "E": return weekName[d.getDay()];
            case "HH": return d.getHours().zf(2);
            case "hh": return ((h = d.getHours() % 12) ? h : 12).zf(2);
            case "mm": return d.getMinutes().zf(2);
            case "ss": return d.getSeconds().zf(2);
            case "a/p": return d.getHours() < 12 ? "오전" : "오후";
            default: return $1;
        }
    });
  };
  
  String.prototype.string = function(len){var s = '', i = 0; while (i++ < len) { s += this; } return s;};
  String.prototype.zf = function(len){return "0".string(len - this.length) + this;};
  Number.prototype.zf = function(len){return this.toString().zf(len);};
  