
var express = require('express');

var jobTopicModel = require('../models/jobTopicModel');
var jobModel = require('../models/jobModel');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', { title: 'Express' });
});
router.get('/allJobTopics', function (req, res, next) {
    jobTopicModel.getAllJobTopics().then(data => {
        if (data.length > 0) {
            // data.forEach(element => {
            //   let buffer = new Buffer(element.img);
            //   let bufferBase64 = buffer.toString('base64');
            //   element.img = bufferBase64;
            // });
            res.json({ data })
        }

    }).catch((err1) => {
        res.json({ message: err1, code: 0 });
    })
});
router.post("/addJob", function (req, res, next) {
    let job = JSON.parse(JSON.stringify(req.body));;
    jobModel.addJob(job).then(data => {
        res.json({ message: 'Success Add New Job', code: 1, note: data });

    }).catch((err) => {
        console.log('err:', err);
        res.json({ message: err, code: 0 })
    })
})
router.post("/editJob", function (req, res, next) {
    let job = JSON.parse(JSON.stringify(req.body));;
    if (job.id_job) {
        jobModel.editJob(job).then(data => {
            res.json({ message: 'Success Update Job', code: 1, note: data });

        }).catch((err) => {
            console.log('err:', err);
            res.json({ message: err, code: 0 })
        })
    }
    else {
        res.json({ message: "Not Found Id Job", code: 0 })

    }

})
router.delete("/deleteJob", function (req, res, next) {
    let id_job = JSON.parse(JSON.stringify(req.body.id_job));;
    if (id_job) {
        jobModel.deleteJobById(id_job).then(data => {
            res.json({ message: 'Success Delete Job', code: 1, note: data });

        }).catch((err) => {
            console.log('err:', err);
            res.json({ message: err, code: 0 })
        })
    }
    else {
        res.json({ message: "Not Found Id Job", code: 0 })

    }

})
module.exports = router;
