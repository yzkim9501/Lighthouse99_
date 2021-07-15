const express = require("express");
const router = express.Router();//라우터라고 선언한다.
const Study = require("../schemas/study");
const User = require("../schemas/user");
const StudyComment = require("../schemas/studyComment");
const StudyJoin = require("../schemas/studyJoin");
const authMiddleware = require("../middlewares/authMiddleware");


// 진행 중/ 완료된 스터디 목록 조회 
router.get("/study", async (req, res, next) => {
    try {
      const studys = await Study.find({ }).sort("-writeDate").lean();
      for(let i=0;i<studys.length;i++){//찾은 스터디를 각각 한개씩 돌며 userId로 리더의 이름을 찾아서 property 설정
        const leader = await User.findOne({userId:studys[i]['userId']})
        studys[i]['leaderName']=leader['nickname']
      }
      res.json({ studys: studys });
    } catch (err) {
      console.error(err);
      next(err);
    }
});


// 스터디 등록 
router.post("/study", authMiddleware, async(req,res)=>{
  const recentStudy = await Study.find().sort("-studyId").limit(1);//최근에 등록된 스터디를 찾아온다

  let studyId=1;
  if(recentStudy.length!=0){
      studyId=recentStudy[0]['studyId']+1//가장 최근의 스터디아이디 +1로 아이디 설정
  }
  const { name, schedule, startDate, endJoinDate, size, explain, joinLater, userId, level, studyType, joinNum } = req.body;
  // 날짜의 포맷을 변경해줘야하므로 const 대신 let으로 선언해준다. (21-07-10 추가)
  let { writeDate } = req.body;
  writeDate=(new Date().format("yyyy-MM-dd a/p hh:mm:ss"))
  await Study.create({ studyId, name, schedule, startDate, endJoinDate, writeDate, size, explain, joinLater, userId, level, studyType, joinNum });
  
  res.send({ studyId });
})


// 스터디 상세 조회 
router.get("/study/:studyId", async (req, res) => {
  const { studyId } = req.params;
  
  studyDetail = await Study.find({ studyId });
  const leader = await User.findOne({userId:studyDetail[0]['userId']})//리더아이디로 리더정보를 가져온다.
  studyDetail['leaderName']=leader['nickname']

  const joinMember= await  StudyJoin.find({studyId})//조인한 유저에 대한 정보를 가져온다.
  let members=[]
  members.push({id:leader['userId'],name:leader['nickname']})
  for(let i=0;i<joinMember.length;i++){
    const id=joinMember[i]['userId'];
    const name=joinMember[i]['userName']
    members.push({id,name})
  }
  
  res.send({ detail: studyDetail ,members:members});
})


// 스터디 수정 
router.put("/study/:studyId", authMiddleware, async (req, res) => {
    const { studyId } = req.params;

    // 작성자와 현재 user가 동일하지 않을 시 수정 진행 X
    const studyDetail = await Study.findOne({ studyId })
    const current_user = res.locals.user.userId
    if (studyDetail.userId !== current_user) {
      res.status(403).send({
        errorMessage: '작성자만 수정할 수 있습니다.'
      })
      return
    }

    const {name,schedule,startDate,endJoinDate,size,explain,joinLater,level,studyType,joinNum} = req.body;
    await Study.updateOne({ studyId }, { $set: { name,schedule,startDate,endJoinDate,size,explain,joinLater,level,studyType,joinNum } });
    
    res.send({ result: "success" });
})


// 스터디 삭제
router.delete("/study/:studyId", authMiddleware, async (req, res) => {
    const { studyId } = req.params;

    // 작성자와 현재 user가 동일하지 않을 시 수정 진행 X
    const studyDetail = await Study.findOne({ studyId })
    const current_user = res.locals.user.userId
    if (studyDetail.userId !== current_user) {
      res.status(403).send({
        errorMessage: '작성자만 삭제할 수 있습니다.'
      })
      return
    }
    await Study.deleteOne({ studyId });
    await StudyComment.deleteMany({studyId})//스터디에 달려있던 코멘트들을 모두 삭제한다.
    await StudyJoin.deleteMany({studyId})
    res.send({ result: "success" });
});

// 스터디 신청 
router.post("/join-study/:studyId", authMiddleware, async (req, res) => {
    try {
      const { studyId } = req.params;
      const { userId } = req.body;

      // 참가자 userId 와 스터디 작성자가 동일한지 확인
      const isLeader = await Study.findOne({ studyId, userId });
      // 이미 참가가 완료된 스터디인지 확인하기 (21-07-10 추가)
      const isExist = await StudyJoin.find({
        $and: [{ studyId }, { userId }],
      })

      // 이미 참가한 참여자 또는 스터디 작성자라면 에러메세지를 뱉는다.
      if (isExist[0])  {
        res.status(403).send({
          errorMessage: '이미 참여하셨습니다.'
        })
        return;
        
      } else if (isLeader) {
        res.status(403).send({
          errorMessage: `작성자는 또 참여하실 수 없습니다. leader user아이디: ${userId}, isLeader: ${isLeader}`
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
      await StudyJoin.create({ studyId, userId, userName, leader:false });
      const studyMemberInfo = await StudyJoin.find({studyId})
      
      res.send({"currentMemberCnt":studyMemberInfo.length,"studyMemberInfo":studyMemberInfo})
  
    } catch (err) {
      console.error(err);
      next(err);
    }
});

// 스터디 탈퇴 (테스트 완료 2021-07-11)
router.delete("/join-study/:studyId", authMiddleware, async (req, res) => {
  const { studyId } = req.params;
  const { userId } = req.body;

  const cur_study = await StudyJoin.findOne({
    $and: [{ studyId }, { userId }],
  });

  if (cur_study) {
    await StudyJoin.deleteOne({ _id: cur_study._id });
    // 스터디 참여 인원 수 내리기
    await Study.updateOne({ studyId },  { $inc: { joinNum: -1 }})
  }

  const studyMemberInfo = await StudyJoin.find({studyId})
      
  res.send({"currentMemberCnt":studyMemberInfo.length,"studyMemberInfo":studyMemberInfo})

});
//특정 포스트의 모든 댓글 조회 
router.get("/study-all-comment/:studyId", async (req, res) => {
  try {
    const { studyId } = req.params;
    let comments = await StudyComment.find({ studyId }).sort("date").lean();

    for(let i=0;i<comments.length;i++){//찾은 스터디를 각각 한개씩 돌며 userId로 리더의 이름을 찾아서 property 설정
      const commentAuthor = await User.findOne({userId:comments[i]['userId']})
      comments[i]['nickname']=commentAuthor['nickname']
    }


    res.json({ comments: comments });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

//댓글 단일 조회 
router.get("/study-comment/:studyCommentId",  async (req, res) => {
const { studyCommentId } = req.params;

comment = await StudyComment.findOne({ studyCommentId });
// 댓글이 존재하는지 확인하기 (21-07-10 추가)
if (!comment) {
  res.status(403).send({
    errorMessage: "존재하지 않는 댓글입니다."
  });
  return;
}
res.json({ detail: comment });
});

//댓글 추가 
router.post('/study-comment', authMiddleware, async (req, res) => {
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
    res.status(403).send({
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
  res.send({ studyCommentId });
});
  

//댓글 삭제 
router.delete("/study-comment/:studyCommentId", authMiddleware, async (req, res) => {
  const { studyCommentId } = req.params;

  
  // 작성자와 현재 user가 동일하지 않을 시 수정 진행 X
  const commentDetail = await StudyComment.findOne({ studyCommentId })
  const current_user = res.locals.user.userId
  if (commentDetail.userId !== current_user) {
    res.status(403).send({
      errorMessage: '작성자만 삭제할 수 있습니다.'
    })
    return
  }


  // comment가 존재하지 않을 시 에러 출력 (21-07-10 추가)
  isExits = await StudyComment.findOne({ studyCommentId });
  if (!isExits) {
    res.status(403).send({
      errorMessage: '존재하지 않는 댓글입니다.'
    })
    return;
  }

    await StudyComment.deleteOne({ studyCommentId });
    res.send({ result: "success" });
});


//댓글 수정 
router.put("/study-comment/:studyCommentId", authMiddleware, async (req, res) => {
  const { studyCommentId } = req.params;
  const { content} = req.body;

  // 작성자와 현재 user가 동일하지 않을 시 수정 진행 X
  const commentDetail = await StudyComment.findOne({ studyCommentId })
  const current_user = res.locals.user.userId
  if (commentDetail.userId !== current_user) {
    res.status(403).send({
      errorMessage: '작성자만 수정할 수 있습니다.'
    })
    return
  }

  // case1: comment가 존재하지 않을 시 에러 출력 (21-07-10 추가)
  isExits = await StudyComment.findOne({ studyCommentId });
  if (!isExits) {
    res.status(403).send({
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
  //모집마감일순으로 최근 5개만 조회
  router.get("/recent-study", async (req, res, next) => {
    try {
      const studys = await Study.find({}).sort("-endJoinDate").limit(5);
      res.json({ studys: studys });
    } catch (err) {
      console.error(err);
      next(err);
    }
});
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
  