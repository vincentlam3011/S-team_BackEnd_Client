var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var redis = require('../utils/redis')
var convertBlobB64 = require('../middleware/convertBlobB64');

var passport = require('../passport');

var applicantModel = require('../models/ApplicantModel');

//Get Applicants by JobId
router.post('/getByJobId', function (req, res, next) {
    let id_job = req.body.id_job;
    applicantModel.getApplicantsByJobId(id_job).then(data => {
        data.forEach(element => {
            element.attachment = convertBlobB64.convertBlobToB64(element.attachment);
        });
        res.json({ info: data, code: 1 });

    }).catch(err => {
        res.json({
            message: "Get failed",
            code: 0,
            info: err,
        })
    })
    // res.send('respond with a resource');
    // res.json(req.headers.authorization.slice(7));
});

//Get Applicants by JobId
router.post('/getApplicantsByUserId', function (req, res, next) {
    let id_user = req.body.id_user;
    applicantModel.getApplicantsByUserId(id_user).then(data => {
        data.forEach(element => {
            element.attachment = convertBlobB64.convertBlobToB64(element.attachment);
        });
        res.json({ info: data, code: 1 });

    }).catch(err => {
        res.json({
            message: "Get failed",
            code: 0,
            info: err,
        })
    })
    // res.send('respond with a resource');
    // res.json(req.headers.authorization.slice(7));
});
//Add New Applicants 
router.post('/addApplicant', function (req, res, next) {
    let applicants = JSON.parse(JSON.stringify(req.body));
    applicantModel.addApplicant(applicants).then(data => {
       
        res.json({ info: data, code: 1 });

    }).catch(err => {
        res.json({
            message: "Add failed",
            code: 0,
            info: err,
        })
    })
    // res.send('respond with a resource');
    // res.json(req.headers.authorization.slice(7));
});
//Update Applicants 
router.post('/editApplicant', function (req, res, next) {
    let applicants = JSON.parse(JSON.stringify(req.body));
    applicantModel.editApplicant(applicants).then(data => {
        res.json({ info: data, code: 1 });
    }).catch(err => {
        res.json({
            message: "Update failed",
            code: 0,
            info: err,
        })
    })
    // res.send('respond with a resource');
    // res.json(req.headers.authorization.slice(7));
});
//Delete Applicants By Applicants Id 
router.delete('/deleteApplicant', function (req, res, next) {
    let id_applicant = req.body.id_applicant
    applicantModel.deleteApplicant(id_applicant).then(data => {
        res.json({ info: data, code: 1 });
    }).catch(err => {
        res.json({
            message: "Update failed",
            code: 0,
            info: err,
        })
    })
    // res.send('respond with a resource');
    // res.json(req.headers.authorization.slice(7));
});
module.exports = router;
