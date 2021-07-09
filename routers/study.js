const express = require("express");
const router = express.Router();//라우터라고 선언한다.
const Study = require("../schemas/study");
const StudyComment = require("../schemas/studyComment");
const StudyJoin = require("../schemas/studyJoin");

router.get("", async (req, res, next) => {
 
});

module.exports = router;