const express = require('express') //express를 쓴다
const app = express()
const cors = require('cors');
const port = 3000// port 는 3000번

const connect=require('./schemas');
connect()
app.use(express.urlencoded({extended: false}))
app.use(express.json())

app.use(cors());

const boardRouter = require("./routers/board");
const studyRouter = require("./routers/study");
const userRouter = require("./routers/user");
app.use("/api", [boardRouter]);
app.use("/api", [studyRouter]);
app.use("/api", [userRouter]);

app.use((req, res, next) => {
  next();
});

app.listen(port, () => {
  console.log(`listening at http://localhost:${port}`)
})