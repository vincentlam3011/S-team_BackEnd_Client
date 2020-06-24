var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var redis = require('../utils/redis')
var convertBlobB64 = require('../middleware/convertBlobB64');
var { response, DEFINED_CODE } = require('../config/response');

var passport = require('../passport');
var _ = require('lodash');
var applicantModel = require('../models/ApplicantModel');

//Get Applicants by JobId
// router.post('/getByJobId', function  (req, res, next) {
//     let id_job = req.body.id_job;
//     applicantModel.getApplicantsByJobId(id_job).then(data => {
//         for (let i = 0; i < data.length; i++) {
//             data[i].attachment = convertBlobB64.convertBlobToB64(data[i].attachment);
//         }
//         response(res, DEFINED_CODE.INTERACT_DATA_SUCCESS, data);
//     }).catch(err => {
//         response(res, DEFINED_CODE.INTERACT_DATA_FAIL, err);
//     })
// });

router.post('/getByJobId', (req, res, next) => {
    let page = Number.parseInt(req.body.page) || 1;
    let take = Number.parseInt(req.body.take) || 6;
    let isASC = Number.parseInt(req.body.isASC) || 1;
    let id = Number.parseInt(req.body.id);
    applicantModel.getApplicantsByJobId(id)
        .then(data => {
            var finalData = data;
            if (isASC !== 1) {
                finalData = finalData.reverse();
            }
            let realData = finalData.slice((page - 1) * take, (page - 1) * take + take);
            // res.json(realData);
            if (realData.length > 0) {
                realData.forEach(element => {
                    if (element.attachment) {
                        element.attachment = convertBlobB64.convertBlobToB64(element.attachment);
                    }
                });
            }
            response(res, DEFINED_CODE.GET_DATA_SUCCESS, { applicantsList: realData, total: finalData.length, page: page })
        }).catch(err => {
            res.json(err);
        })
})

//Get Applicants by UserId
router.post('/getApplicantsByUserId', function (req, res, next) {
    let id_user = req.body.id_user;
    applicantModel.getApplicantsByUserId(id_user).then(data => {
        data.forEach(element => {
            element.attachment = convertBlobB64.convertBlobToB64(element.attachment);
        });
        response(res, DEFINED_CODE.GET_DATA_SUCCESS, data);
    }).catch(err => {
        response(res, DEFINED_CODE.GET_DATA_FAIL);
    })

});
//Add New Applicants 
router.post('/addApplicant', function (req, res, next) {
    let applicants = JSON.parse(JSON.stringify(req.body));
    var token = req.headers.authorization.slice(7);
    var decodedPayload = jwt.decode(token, {
        secret: 'S_Team',
    });
    var id_user = decodedPayload.id;
    applicants.id_user = id_user;
    console.log(applicants.id_user);
    applicantModel.getApplicantsByUserIdJobId(id_user, applicants.id_job).then(data => {
        if (data.length > 0) { // đã tồn tại
            applicantModel.updateNewPrice(applicants).then(updateData => {
                response(res, DEFINED_CODE.INTERACT_DATA_SUCCESS, updateData);
            }).catch(err => {
                response(res, DEFINED_CODE.INTERACT_DATA_FAIL, err);
            })
        }
        else {
            applicantModel.addApplicant(applicants).then(addData => {
                response(res, DEFINED_CODE.INTERACT_DATA_SUCCESS, addData);
            }).catch(err => {
                response(res, DEFINED_CODE.INTERACT_DATA_FAIL, err);
            })
        }
    }).catch(err => {
        response(res, DEFINED_CODE.INTERACT_DATA_FAIL, err);
        // res.json(err)
    })
});
//Edit Applicants 
router.post('/editApplicant', function (req, res, next) {
    let applicants = JSON.parse(JSON.stringify(req.body));
    if (applicants.id_applicant) {
        applicantModel.editApplicant(applicants).then(data => {
            response(res, DEFINED_CODE.INTERACT_DATA_SUCCESS, data);
        }).catch(err => {
            response(res, DEFINED_CODE.INTERACT_DATA_FAIL, err);
        })
    }
    else {
        // response(res, DEFINED_CODE.INTERACT_DATA_FAIL, err);
        response(res, DEFINED_CODE.INTERACT_DATA_FAIL, "No id_applicant found, lacking predential")
    }

});
//Delete Applicants By Applicants Id 
router.delete('/deleteApplicant', function (req, res, next) {
    let id_applicant = req.body.id_applicant;
    if (id_applicant) {
        applicantModel.deleteApplicant(id_applicant).then(data => {
            response(res, DEFINED_CODE.INTERACT_DATA_SUCCESS, data);
        }).catch(err => {
            response(res, DEFINED_CODE.INTERACT_DATA_FAIL);
        })
    }
    else {
        response(res, DEFINED_CODE.EMPTY_ID);
    }

});
module.exports = router;
