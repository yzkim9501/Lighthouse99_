const express = require("express");
const router = express.Router();//라우터라고 선언한다.
const User = require("../schemas/user");
const jwt = require("jsonwebtoken")
const Study = require("../schemas/study");
const authMiddleware = require("../middlewares/authMiddleware")
const studyComment = require("../schemas/studyComment")




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

    const existEmail = await User.find({email}); // request한 email이 User에 존재하는지 확인  
    if (existEmail.length){ 
        res.send({
            result: "emailExist" //email이 존재하면 eamilExist 에러를 보내줌.
        })
        return;
    }
    const existNickname = await User.find({nickname}); // request한 nickname이 User에 존재하는지 확인 
    if (existNickname.length){
        res.send({
            result: "nicknameExist" //nickname이 존재하면 nicknameExist 에러를 보내줌.
        })
        return;
    }

    const recentUserId = await User.find().sort("-userId").limit(1); //가장 최근에 찍힌 userId값 한개를 탐색하여 recentUserId에 담아줌.
    let userId=1;  //만약에 recentUserId가 비어있다면 userId값은 1로 할당됨.
    if(recentUserId.length!=0){  //recentUserId 값이 비어있지 않다면, recentUserId 값에 1을 더하여 다시 userId에 담아줌.
         userId=recentUserId[0]['userId']+1 }

    const user = new User({userId, email, nickname, group, password});
    await user.save();

    res.send({ result: "success" });
    
    
    });


//아이디, 닉네임 중복확인 API

//로그인 API
router.post("/login", async(req, res)=>{
    const{email, password} = req.body;
    const user = await User.findOne({email, password}).exec(); //request한 email, body를 User에서 탐색하여 user에 담아줌. 
    
    if(!user){
        res.send({
            result:"notExist" //만약 user가 없다면 notExist를 보내줌.
        })
        return;
    }

    const userId = user.userId
    const token = jwt.sign({userId: user.userId}, "all-is-well"); //userId를 토큰으로 만듬, key는 "all-is-well"
    res.send({
        result:"success", //success, userId, token값을 보내줌
        userId, 
        token
    })
})

//내 정보 간단조회
router.get("/briefInfo/:userId", authMiddleware, async(req, res)=>{  //authMiddleware를 사용하여 토큰 인증이 된 클라이언트만 사용가능
    const {userId}= req.params; //url의 userId값을 userId에 담음.
    const user= await User.findOne({userId:userId}).exec(); //userId가 userId인 데이터를 User에서 찾아 user안에 담아줌.  
    
    const email = user.email;
    const nickname = user.nickname;
    const group = user.group

        res.json({ //user의 email, nickname, group 값을 response로 보내줌.
            email:email,
            nickname:nickname,
            group:group,
         });       
    })

//참여중인 스터디 확인
router.get("/mystudy/:userId", authMiddleware, async(req, res)=>{ 
    const {userId} = req.params; 
    const studyInfo= await Study.find({userId}).sort("studyId").exec(); //userId가 포함된 데이터들을 StudyJoin에서 탐색하여 studyInfo에 담아줌.
        res.json({
            studyInfo: studyInfo,
         });       
    })
    

//로그인 정보 수정

router.put("/myinfo/:userId", authMiddleware, async(req, res) => {
    const {userId} = req.params;
    const{nickname, password} = req.body;
    
    
    const existNickname = await User.find({nickname}); //닉네임 중복검사
    if (existNickname.length){
        res.send({
            result: "nicknameExist"
        })
        return;
    }

    await User.updateOne({userId:userId}, {$set:{nickname:nickname, password:password}}).exec(); // User의 userId값이 url에서 받은 userId값과 같은 데이터를 수정할건데, nickname, password를 클라이언트에서 요청받은대로 수정할것. 
    res.send({
        result:"success"
    })
    
})

// //내가 쓴 글 조회
// router.get("/mypost/:userId", authMiddleware, async(req, res) =>{
//     const {userId} = req.params;
//     const myPost =  await Study.find({userId}).sort("-date").exec(); //Board에서 userId를 포함하는 데이터를 모두 찾아 myPost에 담음.
    
//     res.send({
//         myPost: myPost, //myPost 리스트를 myPost라는 이름으로 보냄.
//     })
// });


//내가 쓴 댓글 조회
router.get("/mycomment/:userId", authMiddleware, async(req, res) => {
    const {userId} = req.params;
    const myComment = await studyComment.find({userId}).sort("-date").exec(); //BoardComment에서 userId를 포함하는 데이터를 모두 찾아 myComment에 담음.

    res.send({
        myComment:myComment,  //myComment 리스트를 myComment라는 이름으로 보냄.
    })
})


    module.exports = router;



   


   