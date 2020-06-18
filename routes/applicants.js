var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var redis = require('../utils/redis')
var convertBlobB64 = require('../middleware/convertBlobB64');
var { response, DEFINED_CODE } = require('../config/response');

var passport = require('../passport');

var applicantModel = require('../models/ApplicantModel');

//Get Applicants by JobId
router.post('/getByJobId', function (req, res, next) {
    let id_job = req.body.id_job;
    applicantModel.getApplicantsByJobId(id_job).then(data => {
        data.forEach(element => {
            element.attachment = convertBlobB64.convertBlobToB64(element.attachment);
        });
        resspone(res, DEFINED_CODE.GET_DATA_SUCCESS, data);

    }).catch(err => {
        resspone(err, DEFINED_CODE.GET_DATA_FAIL);
    })
    // res.send('respond with a resource');
    // res.json(req.headers.authorization.slice(7));
});

//Get Applicants by UserId
router.post('/getApplicantsByUserId', function (req, res, next) {
    let id_user = req.body.id_user;
    applicantModel.getApplicantsByUserId(id_user).then(data => {
        data.forEach(element => {
            element.attachment = convertBlobB64.convertBlobToB64(element.attachment);
        });
        response(res, DEFINED_CODE.GET_DATA_SUCCESS, data);
    }).catch(err => {
        response(err, DEFINED_CODE.GET_DATA_FAIL);
    })

});
//Add New Applicants 
router.post('/addApplicant', function (req, res, next) {
    let applicants = JSON.parse(JSON.stringify(req.body));
    applicantModel.getApplicantsByUserIdJobId(applicants.id_user, applicants.id_job).then(data=>{
        if(data.length > 0)
        { // đã tồn tại
            applicantModel.updateNewPrice(applicants).then(updateData => {
                response(res, DEFINED_CODE.INTERACT_DATA_SUCCESS, updateData);
            }).catch(err => {
                response(err, DEFINED_CODE.INTERACT_DATA_FAIL);
            })
        }
        else
        {
            applicantModel.addApplicant(applicants).then(addData => {
                response(res, DEFINED_CODE.INTERACT_DATA_SUCCESS, addData);
            }).catch(err => {
                response(err, DEFINED_CODE.INTERACT_DATA_FAIL);
            })
        }
    }).catch(err=>{
        response(err, DEFINED_CODE.INTERACT_DATA_FAIL);
    })
});
//Edit Applicants 
router.post('/editApplicant', function (req, res, next) {
    let applicants = JSON.parse(JSON.stringify(req.body));
    if (applicants.id_applicant) {
        applicantModel.editApplicant(applicants).then(data => {
            response(res, DEFINED_CODE.INTERACT_DATA_SUCCESS, data);
        }).catch(err => {
            response(err, DEFINED_CODE.INTERACT_DATA_FAIL);

        })
    }
    else {
        response(res, DEFINED_CODE.EMPTY_ID);

    }

});
//Delete Applicants By Applicants Id 
router.delete('/deleteApplicant', function (req, res, next) {
    let id_applicant = req.body.id_applicant;
    if (id_applicant) {
        applicantModel.deleteApplicant(id_applicant).then(data => {
            response(res, DEFINED_CODE.INTERACT_DATA_SUCCESS, data);
        }).catch(err => {
            response(err, DEFINED_CODE.INTERACT_DATA_FAIL);
        })
    }
    else {
        response(res, DEFINED_CODE.EMPTY_ID);
    }

});
module.exports = router;
