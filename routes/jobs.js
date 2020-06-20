var express = require('express');
var jwt = require('jsonwebtoken');
var _ = require('lodash')

var jobTopicModel = require('../models/jobTopicModel');
var jobModel = require('../models/jobModel');
var districtProvinceModel = require('../models/districtProvinceModel');
var router = express.Router();
var { response, DEFINED_CODE } = require('../config/response');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', { title: 'Express' });
});

// Get Jobs by applicant id
router.post('/getJobsByApplicant', function (req, res, next) {
    let page = Number.parseInt(req.body.page) || 1;
    let take = Number.parseInt(req.body.take) || 6;
    let isASC = Number.parseInt(req.body.isASC) || 1;
    let status = Number.parseInt(req.body.status);

    var token = req.headers.authorization.slice(7);
    var decodedPayload = jwt.decode(token, {
        secret: 'S_Team',
    });
    let id_user = decodedPayload.id;

    jobModel.getJobsByApplicantId(id_user, status).then(data => {
        
        let jobs = _.groupBy(data, "id_job");
        var finalData = [];
        
        _.forEach(jobs, (value, key) => {
            const tags = _.map(value, item => {
                const { id_tag, tag_name } = item;
                if (id_tag === null || tag_name === null) {
                    return null;
                }
                else {
                    return { id_tag, tag_name };
                }
            })

            const temp = {
                id_job: value[0].id_job,
                // employer: value[0].employer,
                relevance: value[0].relevance,
                title: value[0].title,
                salary: value[0].salary,
                job_topic: value[0].job_topic,
                province: value[0].province,
                district: value[0].district,
                address: value[0].address,
                lat: value[0].lat,
                lng: value[0].lng,
                description: value[0].description,
                post_date: value[0].post_date,
                expire_date: value[0].expire_date,
                dealable: value[0].dealable,
                job_type: value[0].job_type,
                isOnline: value[0].isOnline,
                isCompany: value[0].isCompany,
                vacancy: value[0].vacancy,
                // requirement: value[0].requirement,
                id_status: value[0].id_status,
                img: value[0].img,
                tags: tags[0] === null ? [] : tags,
            }
            finalData.push(temp);
        })
        // Đảo ngược chuỗi vì id_job thêm sau cũng là mới nhất
        if (isASC !== 1) {
            finalData = finalData.reverse();
        }

        let realData = finalData.slice((page - 1) * take, (page - 1) * take + take);
        if (realData.length > 0) {

            realData.forEach(element => {
                if (element.img) {
                    let buffer = new Buffer(element.img);
                    let bufferBase64 = buffer.toString('base64');
                    element.img = bufferBase64;
                }
            });

        }

        console.log('flag 2');
        // console.log(realData);
        response(res, DEFINED_CODE.GET_DATA_SUCCESS, { jobList: realData, total: finalData.length, page: page });

    }).catch((err) => {
        console.log(err);
        response(res, DEFINED_CODE.GET_DATA_FAIL, err);
    })
});

// Get jobs by employer id
router.post('/getJobsByEmployer', function (req, res, next) {
    let page = Number.parseInt(req.body.page) || 1;
    let take = Number.parseInt(req.body.take) || 6;
    let isASC = Number.parseInt(req.body.isASC) || 1;
    let status = Number.parseInt(req.body.status);

    var token = req.headers.authorization.slice(7);
    var decodedPayload = jwt.decode(token, {
        secret: 'S_Team',
    });
    let employer = decodedPayload.id;

    jobModel.getJobsByEmployerId(employer, status).then(data => {
        const jobs = _.groupBy(data, "id_job");
        var finalData = [];

        _.forEach(jobs, (value, key) => {
            const tags = _.map(value, item => {
                const { id_tag, tag_name } = item;
                if (id_tag === null || tag_name === null) {
                    return null;
                }
                else {
                    return { id_tag, tag_name };
                }
            })

            const temp = {
                id_job: value[0].id_job,
                // employer: value[0].employer,
                relevance: value[0].relevance,
                title: value[0].title,
                salary: value[0].salary,
                job_topic: value[0].job_topic,
                province: value[0].province,
                district: value[0].district,
                address: value[0].address,
                lat: value[0].lat,
                lng: value[0].lng,
                description: value[0].description,
                post_date: value[0].post_date,
                expire_date: value[0].expire_date,
                dealable: value[0].dealable,
                job_type: value[0].job_type,
                isOnline: value[0].isOnline,
                isCompany: value[0].isCompany,
                vacancy: value[0].vacancy,
                // requirement: value[0].requirement,
                id_status: value[0].id_status,
                img: value[0].img,
                tags: tags[0] === null ? [] : tags,
            }
            finalData.push(temp);
        })
        // Đảo ngược chuỗi vì id_job thêm sau cũng là mới nhất
        if (isASC !== 1) {
            finalData = finalData.reverse();
        }

        let realData = finalData.slice((page - 1) * take, (page - 1) * take + take);
        if (realData.length > 0) {

            realData.forEach(element => {
                if (element.img) {
                    let buffer = new Buffer(element.img);
                    let bufferBase64 = buffer.toString('base64');
                    element.img = bufferBase64;
                }
            });

        }
        // console.log(realData);
        response(res, DEFINED_CODE.GET_DATA_SUCCESS, { jobList: realData, total: finalData.length, page: page });

    }).catch((err) => {
        response(res, DEFINED_CODE.GET_DATA_FAIL, err);
    })
});

// Get applying jobs by employer id
router.post('/getApplyingJobsByEmployerId', function (req, res, next) {
    let page = Number.parseInt(req.body.page) || 1;
    let take = Number.parseInt(req.body.take) || 6;
    let isASC = Number.parseInt(req.body.isASC) || 1;

    var token = req.headers.authorization.slice(7);
    var decodedPayload = jwt.decode(token, {
        secret: 'S_Team',
    });
    let employer = decodedPayload.id;

    jobModel.getApplyingJobsByEmployerId(employer).then(data => {
        let finalData = [];
        if (isASC !== 1) {
            finalData = _.groupBy(data,'post_date','desc');
        }

        let realData = finalData.slice((page - 1) * take, (page - 1) * take + take);
        
        response(res, DEFINED_CODE.GET_DATA_SUCCESS, { jobList: realData, total: finalData.length, page: page });

    }).catch((err) => {
        response(res, DEFINED_CODE.GET_DATA_FAIL, err);
    })
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

    let province = job.area_province;
    let district = job.area_district;
    districtProvinceModel.getByName(district, province)
        .then(data => {
            let resData = {
                district: data[0],
                province: data[1],
            }
            if (data[0].length > 0 && data[1].length > 0) {
                job.area_district = resData.district[0].id_district;
                job.area_province = resData.province[0].id_province;
                jobModel.addJob(job).then(data => {
                    response(res, DEFINED_CODE.CREATED_DATA_SUCCESS, data);
                }).catch((err) => {
                    // response(err, DEFINED_CODE.CREATE_DATA_FAIL);
                    res.json(err);
                })
                return;
            }
            if (data[1].length === 0) { // Tỉnh chưa có
                let pro = {
                    name: province,
                };
                let dis = {
                    name: district,
                }
                console.log(pro); console.log(dis);
                districtProvinceModel.addArea(pro, dis, false)
                    .then(newDis => {
                        districtProvinceModel.getDisById(newDis.results2.insertId)
                            .then(disData => {
                                console.log(disData)
                                job.area_province = disData[0].id_province;
                                job.area_district = disData[0].id_district;
                                console.log(job);
                                jobModel.addJob(job).then(data => {
                                    response(res, DEFINED_CODE.CREATED_DATA_SUCCESS, data);
                                }).catch((err) => {
                                    // response(err, DEFINED_CODE.CREATE_DATA_FAIL);
                                    res.json(err);
                                })
                            }).catch(err => {
                                res.json(err);
                            })
                    }).catch(err => {
                        res.json(err);
                    })
            } else { // Đã có tỉnh
                let pro = resData.province[0];
                let dis = {
                    name: district,
                }
                console.log(dis);
                districtProvinceModel.addArea(pro, dis, true)
                    .then(newDis => {
                        job.area_province = pro.id_province;
                        job.area_district = newDis.insertId;
                        jobModel.addJob(job).then(data => {
                            response(res, DEFINED_CODE.CREATED_DATA_SUCCESS, data);
                        }).catch((err) => {
                            // response(err, DEFINED_CODE.CREATE_DATA_FAIL);
                            res.json(err);
                        })
                    }).catch(err => {
                        res.json(err);
                    })
            }
        }).catch(err => {
            response(res, DEFINED_CODE.GET_DATA_FAIL, err);
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
                    response(res, DEFINED_CODE.INTERACT_DATA_FAIL, err);
                })
            }
            else {
                response(res, DEFINED_CODE.ERROR_ID);

            }
        }).catch(err => {
            response(res, DEFINED_CODE.INTERACT_DATA_FAIL, err);
        })

    }
    else {
        response(res, DEFINED_CODE.ERROR_ID);

    }

})
module.exports = router;
