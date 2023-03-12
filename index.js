const express = require('express');
const app = express();
const cors = require('cors')
const dotenv = require('dotenv')
const http = require('http').Server(app)

var corsOptions = {
  origin: ["http://localhost:3000","http://127.0.0.1:8000","https://patient-covid-19.onrender.com"]
};


dotenv.config()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors(corsOptions))

let allowCrossDomain = function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
    next();
}
app.use(allowCrossDomain);


const db = require("./models/index.js")

//db.sequelize.sync(db.sequelize.sync({ force: true }))

db.sequelize.sync()
  .then(() => {
    console.log("Synced db.");
  })
  .catch((err) => {
    console.log("Failed to sync db: " + err.message);
  });

  const UserRouter = require('./controller/UserController')
  const PatientRouter = require('./controller/PatientController')

  app.use('/user', UserRouter)
  app.use('/patient', PatientRouter)

const PORT=process.env.PORT

http.listen(PORT, () => { console.log("Server started on http://localhost:" + PORT) })
module.exports = app;
