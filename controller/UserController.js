const db = require("../models");
const express = require('express')
const bcrypt = require('bcrypt')
const router = express.Router();
const User = db.user;
const Op = db.Sequelize.Op;
const jwt = require('jsonwebtoken')

//Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    User.findOne({ where: { email: email } }).then(data => {
        let checkPass = false

        if (data) {
            if (data.status == 1) {
                return res.status(400).send({
                    status: 400,
                    error: 'VALUE_INCORRECT',
                    reasons: `The account ${data.name} has been locked, please contact the administrator to unlock the account again`
                })
            } else {
                checkPass = bcrypt.compareSync(password, data.password)
            }
        }
        if (data && checkPass) {
            const accessToken = jwt.sign({ email: data.email, _id: data._id, name: data.name, avatar_url: data.avatar_url, role: data.role }, process.env.SECRET_KEY)
            return res.json({
                accessToken
            })
        } else {
            return res.status(400).send({
                status: 404,
                error: 'VALUE_INCORRECT',
                reasons: 'Email or password is incorrect'
            })
        }
    })
})

//Thêm mới tài khoản
router.post('/add', async (req, res) => {

    const saltRound = 10
    let passwordHash = await bcrypt.hash(req.body.password, saltRound)

    req.body.password = passwordHash

    const user = {
        avatar_url: req.body.avatarUrl,
        email: req.body.email,
        name: req.body.name,
        password: req.body.password,
        sex: req.body.sex,
        birthday: req.body.birthday,
        role: req.body.role,
        status: req.body.status
    }
    console.log(user)

    User.findAll({ where: { email: req.body.email } }).then(data => {
        if (Array.isArray(data) && data.length) {
            return res.status(400).send({
                status: 400,
                error: 'VALUE_INCORRECT',
                reasons: 'This account already exists in the system'
            })
        } else {
            User.create(user).then(data => {
                res.send(data)
            }).catch(err => {
                console.log(err)
                res.status(400).send({
                    status: 400,
                    error: 'ERROR_SQL',
                    reasons: 'New account creation failed'
                })
            })
        }
    })
})

//Cập nhật thông tin tài khoản
router.put('/edit/:id', (req, res) => {
    const id = req.params.id

    if (!id) {
        res.status(400).send({
            status: 400,
            error: 'VALUE_INCORRECT',
            reasons: 'Missing ID data information'
        })
    }

    User.findAll({ where: { id: id } }).then(async data => {
        if (Array.isArray(data) && data.length) {
            let passwordOld = data[0].dataValues.password
            let passwordNew = ""
            if (passwordOld == req.body.password) {
                passwordNew = passwordOld
            } else {

                passwordNew = await bcrypt.hash(req.body.password, 10)
            }

            const user = {
                avatarUrl: req.body.avatarUrl,
                email: req.body.email,
                name: req.body.name,
                password: passwordNew,
                sex: req.body.sex,
                birthday: req.body.birthday,
                role: req.body.role,
                status: req.body.status
            }

            User.update(user, {
                where: { id: id }
            })
                .then(num => {
                    if (num == 1) {
                        res.status(200).send({
                            message: `Add account ${user.email} successfully`
                        })
                    }
                    else {
                        res.status(400).send({
                            status: 400,
                            error: 'VALUE_INCORRECT',
                            reasons: `${user.email} account not found or upload data is empty`
                        })
                    }
                })
                .catch(err => {
                    res.status(500).send({
                        status: 500,
                        error: 'ERROR_SQL',
                        reasons: `${user.email} account update failed`
                    })
                })
        } else {
            return res.status(400).send(
                {
                    status: 400,
                    error: 'VALUE_INCORRECT',
                    reasons: `Account with ID ${id} does not exist`
                }
            )
        }
    })

})

//Lấy danh sách tài khoản
router.get('/', (req, res) => {
    User.findAll().then(data => {
        res.send(data)
    })
        .catch(err => [
            res.status(500).send({
                status: 400,
                error: 'ERROR_SQL',
                reasons: 'Retrieving account data failed'
            })
        ])
})

//Lấy danh sách tài khoản với phân trang
router.get('/all', (req, res) => {
    const { page, size, name } = req.query
    const { limit, offset } = getPagination(page, size);
    var condition = name ? { name: { [Op.like]: `%${name}%` } } : null;

    User.findAndCountAll({where: condition, limit, offset, include: ["role_user"] })
        .then(data => {
            const response = getPagingData(data, page, limit)
        res.send(response)
        })
        .catch(err => {
            console.log("Retrieving patient data failed because: " + err.message)
            res.status(500).send({
                status: 400,
                error: 'VALUE_INCORRECT',
                reasons: `Patient data retrieval failed`
            });
        })
})

const getPagination = (page, size) => {
    const limit = size ? +size : 3;
    const offset = page ? page * limit : 0;

    return { limit, offset };
};

const getPagingData = (data, page, limit) => {
    const { count: totalItems, rows: accounts } = data;
    const currentPage = page ? +page : 0;
    const totalPages = Math.ceil(totalItems / limit);

    return { totalItems, accounts, totalPages, currentPage };
};

//Xoá tài khoản theo id
router.delete('/delete/:id', async (req, res) => {
    const id = req.params.id

    User.destroy({
        where: { id: id }
    }).then(num => {
        if (num == 1) {
            return res.status(200).send({
                message: `Delete account ID ${id} successfully`
            })
        } else {
            return res.status(400).send({
                status: 400,
                error: 'ERROR_SQL',
                reasons: `Account deletion failed, maybe account ID ${id} doesn't exist`
            })
        }
    }).catch(err => {
        return res.status(400).send({
            status: 400,
            error: 'VALUE_INCORRECT',
            reasons: `Deleting account ID ${id} failed`
        })
    })
})

module.exports = router;