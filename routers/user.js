const express = require("express");
const router = express.Router();//라우터라고 선언한다.
const User = require("../schemas/user");
const jwt = require("jsonwebtoken")
const StudyJoin = require("../schemas/studyJoin");
const authMiddleware = require("../middlewares/authMiddleware")
const Board = require("../schemas/board")
const BoardComment = require("../schemas/boardComment")



//회원가입 API
router.post("/register",async(req,res)=>{
    
    const{email, nickname, group, password} = req.body;

    
    const localPart = email.split('@')[0]  //이메일의 로컬파트(@를 기준으로 앞부분)가 패스워드에 포함되지 않게
    if (password.includes(localPart)){
        res.send({
            result: "existError"  //로컬파트각 패스워드에 포함될 경우 response로 "existError" 보내줌.
        })
        return;
    }

    const existEmail = await User.find({email});
    if (existEmail.length){
        res.send({
            result: "emailExist"
        })
        return;
    }
    const existNickname = await User.find({nickname});
    if (existNickname.length){
        res.send({
            result: "nicknameExist"
        })
        return;
    }

    const recentUserId = await User.find().sort("-userId").limit(1);
    let userId=1; 
    if(recentUserId.length!=0){
         userId=recentUserId[0]['userId']+1 }

    const user = new User({userId, email, nickname, group, password});
    await user.save();

    res.send({ result: "success" });
    
    
    });


//아이디, 닉네임 중복확인 API

//로그인 API
router.post("/login", async(req, res)=>{
    const{email, password} = req.body;
    const user = await User.findOne({email, password}).exec();
    const userId = user.userId

    if(!user){
        res.send({
            result:"notExist"
        })
        return;
    }

    const token = jwt.sign({userId: user.userId}, "all-is-well");
    res.send({
        result:"success",
        userId, 
        token
    })
})

//내 정보 간단조회
router.get("/briefInfo/:userId", authMiddleware, async(req, res)=>{
    const {userId}= req.params;
    const user= await User.findOne({userId:userId}).exec();
    
    const email = user.email;
    const nickname = user.nickname;
    const group = user.group

        res.json({
            email:email,
            nickname:nickname,
            group:group,
         });       
    })

//참여중인 스터디 확인
router.get("/mystudy/:userId", authMiddleware, async(req, res)=>{
    const {userId} = req.params;
    const studyInfo= await StudyJoin.find({userId}).exec();
        res.json({
            studyInfo: studyInfo,
         });       
    })
    

//로그인 정보 수정

router.put("/myinfo/:userId", authMiddleware, async(req, res) => {
    const {userId} = req.params;
    const{nickname, password, confirmPassword} = req.body;
    
    if (password !== confirmPassword){
        res.send({
            result: "passwordError"
        })
        return;
    }
    
    const existNickname = await User.find({nickname});
    if (existNickname.length){
        res.send({
            result: "nicknameExist"
        })
        return;
    }

    await User.updateOne({userId:userId}, {$set:{nickname:nickname, password:password}}).exec();
    res.send({
        result:"success"
    })
    
})

//내가 쓴 글 조회
router.get("/mypost/:userId", authMiddleware, async(req, res) =>{
    const {userId} = req.params;
    const myPost =  await Board.find({userId}).exec();
    
    res.send({
        myPost: myPost,
    })
});


//내가 쓴 댓글 조회
router.get("/mycomment/:userId", authMiddleware, async(req, res) => {
    const {userId} = req.params;
    const myComment = await BoardComment.find({userId}).exec();

    res.send({
        myComment:myComment,
    })
})


    module.exports = router;



   


   