const axios = require("axios");

const db = require("../models");
const express = require('express')
const constants = require('../constants')
const router = express.Router();
const csvtojson = require('csvtojson');
const fs = require("fs");
const { parse } = require("csv-parse");
const { count } = require("console");
const Patient = db.patient;
const Euclidean = db.euclidean;
const Manhattan = db.manhattan;
const Op = db.Sequelize.Op;

let instantAxios = axios.create({
    timeout: 20000,
    baseURL: 'http://127.0.0.1:8000'
})

const NUMBER_MONTH = 12

//cal rank patient
router.get('/rank', async (req, res) => {
    const { measure } = req.query
    instantAxios.get('/patient/rank', { params: { measure: measure } }).then(resData => {
        var status = resData.data.status
        var count_failed = resData.data.count_failed
        var count_success = resData.data.count_success
        if (status == 200 && count_failed == 0) {
            res.status(200).send({ message: `Calculate the rating of ${count_success} successful patients` })
        }
    })
        .catch(err => {
            console.log(err)
            res.status(400).send({
                status: 400,
                error: 'ERROR_SERVER',
                reasons: `Patient rating calculation failed`
            })
        })

})

//get rank
router.get('/rank/get', (req, res) => {
    const measure = req.query.measure
    const ModelMeasure = matchMeasure(measure)
    var condition = {status: {[Op.eq]: 2} }

    ModelMeasure.findAll({ include: ["patient"], order: [['worst_similarity', 'DESC']] }).then(data => {

        res.status(200).send({
            data
        })
    })
        .catch(err => {
            console.log("Get rank with err: "+err)
            res.status(500).send({
                status: 500,
                error: 'VALUE_INCORRECT',
                reasons: err.message || `Retrieving data failed`
            })
        })
})


const matchMeasure = (measure) => {
    if (measure == "ECD") {
        return Euclidean
    } else if (measure == "MHT") {
        return Manhattan
    } else if (measure == "CLT") {
        return Correlation
    } else if (measure == "CSL") {
        return CosineSimilarity
    } else {
        return `Not found ${measure}`
    }
}

//get patient with id
router.get('/:id', async (req, res) => {
    let id = req.params.id
    if (!id) {
        res.status(400).send({
            status: 400,
            error: 'VALUE_INCORRECT',
            reasons: `Missing patient ID information`
        })
    } else {
        Patient.findByPk(id)
            .then(data => {
                if (data) {
                    res.send(data)
                } else {
                    res.status(400).send({
                        status: 400,
                        error: 'ERROR_SQL',
                        reasons: `Couldn't get patient ID ${id}`
                    })
                }
            })
    }
})

//get info dashboard
router.get('/dashboard/info', (req, res) => {

    Patient.findAll().then(data => {
        var maleCount = 0;
        var femaleCount = 0;

        const groupDate = handleGroupDate(data)
        var totalNumberPatient = data.length;
        var confirmedPatient = 0;
        var waitingPatient = 0;
        var deletePatient = 0;
        data.forEach(item => {

            if (item.dataValues.status == 0) {
                waitingPatient += 1
                if(item.dataValues.gender == 0){
                    maleCount += 1
                }else if(item.dataValues.gender == 1) {
                    femaleCount += 1
                }else{

                }
            } else if (item.dataValues.status == 1) {
                confirmedPatient += 1
                if(item.dataValues.gender == 0){
                    maleCount += 1
                }else if(item.dataValues.gender == 1) {
                    femaleCount += 1
                }else{
                    
                }
            } else if (item.dataValues.status == 2) {
                deletePatient += 1
            } else { }
        })
        res.status(200).send({
            totalNumberPatient,
            confirmedPatient,
            waitingPatient,
            deletePatient,
            groupDate,
            maleCount,
            femaleCount
        })
    })
        .catch(err => {
            console.log(err)
            res.status(500).send({
                status: 500,
                error: 'VALUE_INCORRECT',
                reasons: err.message || `Retrieving data failed`
            })
        })
})

const handleGroupDate = (data) => {
    const {listDate, dayDateNow} = subsDate()
    const groups = data.reduce((groups, patient) => {
        const date_cv = patient.dataValues.createdAt.toISOString().split('T')[0];
        const date = date_cv.split(('-'))[0]+'-'+date_cv.split(('-'))[1];

        if(!groups[date]){
            groups[date] = []
        }

        groups[date].push(patient.dataValues);

        return groups;
      }, {});

      const groupArrays =listDate.map((date, index) => {
        let discharge = 0
        let admission = 0
        if(groups[date]){
            discharge = groups[date].filter(patient => patient.status == 2).length
            admission = groups[date].filter(patient => patient.status == 1).length
        }
        return {
          date: index != 0 ? date.split("-")[1]+"/01/"+date.split("-")[0] : date.split("-")[1]+"/"+dayDateNow+"/"+date.split("-")[0],
          admission: admission,
          discharge: discharge
        };
      });

      return groupArrays
}

const subsDate = () => {
    let date_now = new Date();
    const dayDateNow = ('0'+date_now.getDate()).slice(-2)
    date_now.setMonth(date_now.getMonth() + 1)
    let listDate = []
    for(i=0; i < NUMBER_MONTH; i++){
        let numberSub = i != 0 ? 1 : 0
        date_now.setMonth(date_now.getMonth() - numberSub)
        const month = date_now.getMonth() != 0 ? ('0'+date_now.getMonth()).slice(-2) : 12
        const year = date_now.getMonth() != 0 ? date_now.getFullYear() : date_now.getFullYear() - 1
        listDate.push(year+"-"+month)
    }
    return {listDate, dayDateNow}
}

//get list patient with pagination
router.get('/', (req, res) => {
    const { page, size, name } = req.query
    const { limit, offset } = getPagination(page, size);
    var condition = name ? { name: { [Op.like]: `%${name}%` }, status: {[Op.ne]: 2} } : {status: {[Op.ne]: 2}};

    Patient.findAndCountAll({ where: condition, limit, offset })
        .then(data => {
            const response = getPagingData(data, page, limit);
            res.send(response);
        })
        .catch(err => {
            console.log("Retrieving patient data failed because: " + err.message)
            res.status(500).send({
                status: 400,
                error: 'VALUE_INCORRECT',
                reasons: `Patient data retrieval failed`
            });
        });
})

const getPagination = (page, size) => {
    const limit = size ? +size : 3;
    const offset = page ? page * limit : 0;

    return { limit, offset };
};

const getPagingData = (data, page, limit) => {
    const { count: totalItems, rows: patients } = data;
    const currentPage = page ? +page : 0;
    const totalPages = Math.ceil(totalItems / limit);

    return { totalItems, patients, totalPages, currentPage };
};

//Add patient
router.post('/add', async (req, res) => {
    // const authId = req.authenticateUser._id
    const statusWithRole = req.body.roleUser == 'BS' ? 1 : 0
    const patient = {
        name: req.body.name,
        avatar_url: req.body.avatar_url,
        gender: req.body.gender,
        white_blood_cell_count: req.body.white_bcc,
        neutrophil_count: req.body.neutrophil_c,
        lymphocyte_count: req.body.lymphocyte_c,
        haemoglobin: req.body.haemoglobin,
        blood_platelet_count: req.body.blood_pc,
        albumin: req.body.albumin,
        c_reactive_protein: req.body.c_rp,
        interleukin_6: req.body.interleukin_6,
        status: statusWithRole
    }

    //Save in DB
    Patient.create(patient)
        .then(data => {
            res.send(data)
        })
        .catch(err => {

            console.log("Add new error patient: " + err.message)

            res.status(400).send({
                status: 400,
                error: 'ERROR_SQL',
                reasons: `Add new patient ${patient.name} failed`
            })
        })
})

//Update patient with id
router.put('/edit/:id', (req, res) => {

    const id = req.params.id

    if (!id) {
        res.status(400).send({
            status: 400,
            error: 'VALUE_INCORRECT',
            reasons: `Missing patient ID information`
        })
    }

    const patient = {
        name: req.body.name,
        gender: req.body.gender,
        white_blood_cell_count: req.body.white_bcc,
        neutrophil_count: req.body.neutrophil_c,
        lymphocyte_count: req.body.lymphocyte_c,
        haemoglobin: req.body.haemoglobin,
        blood_platelet_count: req.body.blood_pc,
        albumin: req.body.albumin,
        c_reactive_protein: req.body.c_rp,
        interleukin_6: req.body.interleukin_6,
        aspartate_aminotransferase: req.body.aspartate_aminotransferase,
        creatinine: req.body.creatinine,
        status: req.body.status
    }

    Patient.update(patient, {
        where: { id: id }
    })
        .then(num => {
            if (num == 1) {
                res.send({
                    message: `Update patient information ID ${id} successfully`
                })
            }
            else {
                res.send({
                    status: 400,
                    error: 'VALUE_INCORRECT',
                    reasons: `Xóa ID tài khoản ${id} không thành công, có thể do không tìm thấy bệnh nhân tại hoặc thiếu dữ liệu tải lên`
                })
            }
        })
        .catch(err => {
            console.log(`Update patient ${patient.id} error: ` + err.message)
            res.status(500).send({
                status: 400,
                error: 'ERROR_SQL',
                reasons: `Update patient information ${patient.name} failed`
            })
        })

})

router.put('/update-status', (req, res) => {
    const {id, status} = req.body
    Patient.update(
        {status: status},
       { where: {id: id}})
    .then(result => {
        res.send({
            message: `Update status patient ID ${id} successfully`
        })
    })
    .catch(err => {
        console.log(`Update status patient ${id} error: ` + err.message)
        res.status(500).send({
            status: 400,
            error: 'ERROR_SQL',
            reasons: `Update status patient ${id} failed`
        })
    })
})

//Delete patient with id
router.delete('/delete/:id', async (req, res) => {
    const id = req.params.id

    Patient.update(
        {status: 2},
       { where: {id: id}})
       .then(num => {
        if (num == 1) {
            res.send({
                message: `Delete patient information ID ${id} successfully`
            })
        } else {
            res.send({
                status: 400,
                error: 'VALUE_INCORRECT',
                reasons: `Delete patient information ID ${id} failed, probably because patient information does not exist`
            })
        }
    }).catch(err => {
        console.log(`Delete patient ${id} with err: `+err)
        res.status(400).send({
            status: 400,
            error: 'ERROR_SQL',
            reasons: `Delete patient information ID ${id} failed`
        })
    })
})

//Update list patients with file csv
router.post('/upload', constants.upload.single('File'), (req, res) => {
    const countPatientAddSuccess = 0
    const listError = []
    csvtojson().fromFile(`./uploads/${req.file.filename}`).then(source => {

        for (var i = 0; i < source.length; i++) {
            const rndInt = Math.floor(Math.random() * 24) + 1
            let avatarUrl = "/assets/images/avatars/avatar_" + rndInt + ".jpg"
    
            const data_patient = {
                name: source[i]['Name'] || "Unknown name",
                avatar_url: avatarUrl,
                gender: source[i]['Gender'] || 0,
                white_blood_cell_count: Number(source[i]['White blood cell count']) || 0,
                neutrophil_count: Number(source[i]['Neutrophil count']) || 0,
                lymphocyte_count: Number(source[i]['Lymphocyte count']) || 0,
                haemoglobin: Number(source[i]['Haemoglobin']) || 0,
                blood_platelet_count: Number(source[i]['Blood platelet count']) || 0,
                albumin: Number(source[i]['Albumin']) || 0,
                c_reactive_protein: Number(source[i]['C-reactive protein']) || 0,
                interleukin_6: Number(source[i]['Interleukin 6']) || 0,
                status: 1
            }

            //Save in DB
            Patient.create(data_patient)
                .then(data => {
                    countPatientAddSuccess += 1
                })
                .catch(err => {
                    listError.push({
                        'name': data_patient.name,
                        'error': err.message
                    })
                })
        }
        if (listError.length == 0) {
            res.status(200).send({
                status: 200,
                count_add_success: countPatientAddSuccess,
                count_add_failed: listError.length
            })
        } else {
            res.status(200).send({
                status: 400,
                count_add_success: countPatientAddSuccess,
                count_add_failed: listError.length,
                errors: listError
            })
        }
    })

})



module.exports = router;
