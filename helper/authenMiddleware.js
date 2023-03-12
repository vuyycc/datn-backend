const jwt = require('jsonwebtoken')
const db = require("../models");
const User = db.user;

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, process.env.SECRET_KEY,async (err, payload) => {
            if (err) {
                return res.sendStatus(403);
            }
            console.log(payload)
        User.findByPk(payload._id).then(data => {
            if(data) {
                req.authenticateUser = user
                next();
            } 
          })      
           
        });
    } else {
        res.sendStatus(401);
    }
};

module.exports = { authenticateJWT }