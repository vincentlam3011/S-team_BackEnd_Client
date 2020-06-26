var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var redis = require('../utils/redis')
var convertBlobB64 = require('../middleware/convertBlobB64');
var { response, DEFINED_CODE } = require('../config/response');

var passport = require('../passport');
var _ = require('lodash');
var acceptedModel = require('../models/acceptedModel');

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

router.post('/reviewFromEmployer', (req, res, next) => {
    const { id_applicant, id_job, feedback_fromEmployer, rating_fromEmployer } = req.body;

    acceptedModel.reviewFromEmployer(req.body)
        .then(data => {

            response(res, DEFINED_CODE.GET_DATA_SUCCESS, data)
        }).catch(err => {
            response(res, DEFINED_CODE.GET_DATA_FAIL, err);
        })
})
router.post('/reviewFromEmployee', (req, res, next) => {
    const { id_applicant, id_job, feedback_fromEmployee, rating_fromEmployee } = req.body;
    
    acceptedModel.reviewFromEmployee(req.body)
        .then(data => {

            response(res, DEFINED_CODE.GET_DATA_SUCCESS, data)
        }).catch(err => {
            response(res, DEFINED_CODE.GET_DATA_FAIL, err);
        })
})

module.exports = router;
