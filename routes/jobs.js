
var express = require('express');

var jobTopicModel = require('../models/jobTopicModel');
var jobModel = require('../models/jobModel');
var router = express.Router();
var { response, DEFINED_CODE } = require('../config/response');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', { title: 'Express' });
});
router.get('/allJobsTopics', function (req, res, next) {
    jobTopicModel.getAllJobTopics().then(data => {
        if (data.length > 0) {
            data.forEach(element => {
                let buffer = new Buffer(element.img);
                let bufferBase64 = buffer.toString('base64');
                element.img = bufferBase64;
            });
            response(res, DEFINED_CODE.GET_DATA_SUCCESS, data);
        }
    }).catch((err) => {
        response(err, DEFINED_CODE.GET_DATA_FAIL);
    })
});
router.post("/addJob", function (req, res, next) {
    let job = JSON.parse(JSON.stringify(req.body));
    jobModel.addJob(job).then(data => {
        response(res, DEFINED_CODE.CREATED_DATA_SUCCESS, job);
    }).catch((err) => {
        response(err, DEFINED_CODE.CREATE_DATA_FAIL);
    })
})
router.post("/editJob", function (req, res, next) {
    let job = req.body;;
    console.log('job:', job)
    if (job.id_job) {

        jobModel.getJobById(job.id_job).then(result => {
            //Existed
            if (result.id_job) {
                jobModel.editJob(job).then(data => {
                    console.log("go to then promise");
                    response(res, DEFINED_CODE.INTERACT_DATA_SUCCESS, job);
                }).catch(err => {
                    console.log('err:', err)
                    response(res, DEFINED_CODE.INTERACT_DATA_FAIL);
                })
            }
            else {
                response(res, DEFINED_CODE.ERROR_ID);

            }
        })

    }
    else {
        console.log("Go Inside")
        response(res, DEFINED_CODE.ERROR_ID);
    }

})
router.delete("/deleteJob", function (req, res, next) {
    let id_job = JSON.parse(JSON.stringify(req.body.id_job));;
    if (id_job) {
        jobModel.getJobById(id_job).then(result => {
            //Existed
            if (result.id_job) {
                jobModel.deleteJobById(id_job).then(data => {
                    response(res, DEFINED_CODE.INTERACT_DATA_SUCCESS);

                }).catch((err) => {
                    console.log('err:', err)
                    response(res, DEFINED_CODE.INTERACT_DATA_FAIL,err);
                })
            }
            else {
                response(res, DEFINED_CODE.ERROR_ID);

            }
        }).catch(err => {
            response(res, DEFINED_CODE.INTERACT_DATA_FAIL,err);
        })

    }
    else {
        response(res, DEFINED_CODE.ERROR_ID);

    }

})
module.exports = router;
