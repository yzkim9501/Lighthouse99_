const express = require('express') //express를 쓴다
const app = express()
// const cors = require('cors');
const port = 3000// port 는 3000번
const swaggerUi = require('swagger-ui-express')
const swaggerFile = require('./swagger_output.json')
const connect=require('./schemas');
connect()
app.use(express.urlencoded({extended: false}))
app.use(express.json())

// const corsOptions = {
//   origin: "http://lighthouse99.club.s3-website.ap-northeast-2.amazonaws.com",
//   credentials: true
// }
// app.use(cors(corsOptions));

const boardRouter = require("./routers/board");
const studyRouter = require("./routers/study");
const userRouter = require("./routers/user");
app.use("/api", [boardRouter]);
app.use("/api", [studyRouter]);
app.use("/api", [userRouter]);
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerFile)) // docs 대신 swagger로 수정한다.
app.use((req, res, next) => {
  next();
});

app.listen(port, () => {
  console.log(`listening at http://localhost:${port}`)
})