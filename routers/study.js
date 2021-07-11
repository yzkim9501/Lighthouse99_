const express = require("express");
const router = express.Router();//라우터라고 선언한다.
const Study = require("../schemas/study");
const User = require("../schemas/user");
const StudyComment = require("../schemas/studyComment");
const StudyJoin = require("../schemas/studyJoin");


// 진행 중/ 완료된 스터디 목록 조회 
router.get("/study", async (req, res, next) => {
    try {
      const studys = await Study.find({ }).sort("-date");
      res.json({ studys: studys });
    } catch (err) {
      console.error(err);
      next(err);
    }
});


// 스터디 등록 
router.post("/study",async(req,res)=>{
  const recentStudy = await Study.find().sort("-studyId").limit(1);

  let studyId=1;
  if(recentStudy.length!=0){
      studyId=recentStudy[0]['studyId']+1
  }
  const { name, schedule, startDate, endJoinDate, size, explain, joinLater, userId, level, studyType, joinNum } = req.body;
  // 날짜를 포맷을 변경해줘야하므로 const 대신 let으로 선언해준다. (21-07-10 추가)
  let { writeDate } = req.body;
  writeDate=(new Date().format("yyyy-MM-dd a/p hh:mm:ss"))
  await Study.create({ studyId, name, schedule, startDate, endJoinDate, writeDate, size, explain, joinLater, userId, level, studyType, joinNum });
  res.send({ result: "success" });
})


// 스터디 상세 조회 
router.get("/study/:studyId", async (req, res) => {
  const { studyId } = req.params;
  studyDetail = await Study.find({ studyId });
  res.send({ detail: studyDetail });
})


// 스터디 수정 
router.put("/study/:studyId", async (req, res) => {
    const { studyId } = req.params;
    const {name,schedule,startDate,endJoinDate,writeDate,size,explain,joinLater,userId,level,studyType,joinNum} = req.body;
    await Study.updateOne({ studyId }, { $set: { name,schedule,startDate,endJoinDate,size,explain,joinLater,userId,level,studyType,joinNum } });
    res.send({ result: "success" });
})


// 스터디 삭제
router.delete("/study/:studyId", async (req, res) => {
    const { studyId } = req.params;
    await Study.deleteOne({ studyId });
    res.send({ result: "success" });
});


// 스터디 신청 
router.post("/join-study/:studyId", async (req, res) => {
    try {
      const { studyId } = req.params;
      const { userId, leader } = req.body;

      // 이미 참가가 완료된 스터디인지 확인하기 (21-07-10 추가)
      const isExist = await StudyJoin.find({
        $and: [{ studyId }, { userId }],
      })

      if (isExist[0]) {
        res.status(401).send({
          errorMessage: '이미 참여하셨습니다.'
        })
        return;
      }

      // 모집 인원과 현재 참가 인원을 비교해 마감 유무 확인 (21-07-10 추가)
      const { size, joinNum } = await Study.findOne ({ studyId });  
      if (size == joinNum) {
        res.status(403).send({
          errorMessage: '스터디 모집 인원이 마감되었습니다'
        })
        return;
      }


      // 신청자의 user Id 기준으로 user db에서 nickname 가져오기 (21-07-10 추가)
      const nickname = await User.findOne({ userId },{ nickname : 1, _id: 0});
      const userName = nickname.nickname

      // 스터디 참여 인원 수 증가
      await Study.updateOne({ studyId },  { $inc: { joinNum: 1 }});
      await StudyJoin.create({ studyId, userId, userName, leader });
      studyMemberInfo = await StudyJoin.find({studyId})

      
      res.send({"currentMemberCnt":studyMemberInfo.length,"studyMemberInfo":studyMemberInfo})
  
    } catch (err) {
      console.error(err);
      next(err);
    }
});

// 스터디 탈퇴 (테스트 완료 2021-07-11)
router.delete("/join-study/:studyId", async (req, res) => {
  const { studyId } = req.params;
  const { userId } = req.body;

  const cur_comment = await StudyJoin.findOne({
    $and: [{ studyId }, { userId }],
  });

  // console.log(cur_comment)
  // console.log(cur_comment._id)

  if (cur_comment) {
    await StudyJoin.deleteOne({ _id: cur_comment._id });
    // 스터디 참여 인원 수 내리기
    await Study.updateOne({ studyId },  { $inc: { joinNum: -1 }})
  }

  res.send({ result: "success" })

});



//특정 포스트의 모든 댓글 조회 
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
  

//댓글 단일 조회 
router.get("/study-comment/:studyCommentId", async (req, res) => {
  const { studyCommentId } = req.params;
  
  comment = await StudyComment.findOne({ studyCommentId });
  // 댓글이 존재하는지 확인하기 (21-07-10 추가)
  if (!comment) {
    res.status(401).send({
      errorMessage: "존재하지 않는 댓글입니다."
    });
    return;
  }


  res.json({ detail: comment });
});
  

//댓글 추가 
router.post('/study-comment', async (req, res) => {
  const recentComment = await StudyComment.find().sort("-studyCommentId").limit(1);
  let studyCommentId=1;
  if(recentComment.length!=0){
    console.log(recentComment)
    studyCommentId = recentComment[0]['studyCommentId']+1
  }
  console.log(studyCommentId)

  const { userId, studyId, content } = req.body;
  const date = (new Date().format("yyyy-MM-dd a/p hh:mm:ss"))

  // board id가 틀렸을 시 에러 출력 (21-07-10 추가)
  isExits = await Study.findOne({ studyId });
  if (!isExits) {
    res.status(401).send({
      errorMessage: '존재하지 않는 게시물입니다.'
    });
    return;
    // case2: content가 존재하지 않을 시 에러 출력 (21-07-10 추가)
  } else if (content == "") {
    res.status(403).send({
      errorMessage: '내용을 입력해주세요.'
    });
    return;
  }  

  await StudyComment.create({ studyCommentId, studyId, content, userId, date });
  res.send({ result: "success" });
});
  

//댓글 삭제 
router.delete("/study-comment/:studyCommentId", async (req, res) => {
  const { studyCommentId } = req.params;

  // comment가 존재하지 않을 시 에러 출력 (21-07-10 추가)
  isExits = await StudyComment.findOne({ studyCommentId });
  if (!isExits) {
    res.status(401).send({
      errorMessage: '존재하지 않는 댓글입니다.'
    })
    return;
  }

    await StudyComment.deleteOne({ studyCommentId });
    res.send({ result: "success" });
});


//댓글 수정 
router.put("/study-comment/:studyCommentId", async (req, res) => {
  const { studyCommentId } = req.params;
  const { content} = req.body;

  // case1: comment가 존재하지 않을 시 에러 출력 (21-07-10 추가)
  isExits = await StudyComment.findOne({ studyCommentId });
  if (!isExits) {
    res.status(401).send({
      errorMessage: '존재하지 않는 댓글입니다.'
    });
    return;
  // case2: content가 존재하지 않을 시 에러 출력 (21-07-10 추가)
  } else if (content == "") {
    res.status(403).send({
      errorMessage: '내용을 입력해주세요.'
    })
    return;
  }  
  await StudyComment.updateOne({ studyCommentId }, { $set: { content } });
  res.send({ result: "success" });
})

// 시간 포맷 변경
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
  