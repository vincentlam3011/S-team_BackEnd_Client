var express = require('express');
var jwt = require('jsonwebtoken');
var _ = require('lodash')

var jobTopicModel = require('../models/jobTopicModel');
var jobModel = require('../models/jobModel');
var districtProvinceModel = require('../models/districtProvinceModel');
var applicantModel = require('../models/ApplicantModel');

var router = express.Router();
var { response, DEFINED_CODE } = require('../config/response');
var firebase = require('../middleware/firebaseFunction')


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
                id_applicant: value[0].id_applicant,
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
        // if (isASC !== 1) {
        //     finalData = finalData.reverse();
        // }

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

        // console.log('flag 2');
        // console.log(realData);
        response(res, DEFINED_CODE.GET_DATA_SUCCESS, { jobList: realData, total: finalData.length, page: page });

    }).catch((err) => {
        console.log(err);
        response(res, DEFINED_CODE.GET_DATA_FAIL, err);
    })
});

// Get Jobs by applicant id
router.post('/getJobsByApplicantId', function (req, res, next) {
    let page = Number.parseInt(req.body.page) || 1;
    let take = Number.parseInt(req.body.take) || 6;
    let isASC = Number.parseInt(req.body.isASC) || 1;
    let status = Number.parseInt(req.body.status) || 1;

    var token = req.headers.authorization.slice(7);
    var decodedPayload = jwt.decode(token, {
        secret: 'S_Team',
    });
    let id_user = decodedPayload.id;

    jobModel.getJobsByApplicantId(id_user, status).then(data => {
        let finalData = data;

        // Đảo ngược chuỗi vì id_job thêm sau cũng là mới nhất
        // if (isASC !== 1) {
        //     finalData = _.groupBy(finalData, 'post_date', 'desc');
        // }

        let realData = finalData.slice((page - 1) * take, (page - 1) * take + take);
        if (realData.length > 0) {
            realData.forEach(element => {
                if (element.avatarImg) {
                    let buffer = new Buffer(element.avatarImg);
                    let bufferBase64 = buffer.toString('base64');
                    element.avatarImg = bufferBase64;
                }
            });
        }

        response(res, DEFINED_CODE.GET_DATA_SUCCESS, { jobList: realData, total: finalData.length, page: page });

    }).catch((err) => {
        console.log(err);
        response(res, DEFINED_CODE.GET_DATA_FAIL, err);
    })
});

// Get jobs by employer id bản web
router.post('/getJobsByEmployerIdForWeb', function (req, res, next) {
    let page = Number.parseInt(req.body.page) || 1;
    let take = Number.parseInt(req.body.take) || 6;
    let isASC = Number.parseInt(req.body.isASC) || 1;
    let status = Number.parseInt(req.body.status) || 1;

    var token = req.headers.authorization.slice(7);
    var decodedPayload = jwt.decode(token, {
        secret: 'S_Team',
    });
    let employer = decodedPayload.id;

    jobModel.getJobsByEmployerIdForWeb(employer, status).then(data => {
        const jobs = _.groupBy(data, "id_job");
        var finalData = [];

        _.forEach(jobs, (value, key) => {
            let candidates = 0, participants = 0;
            const tags = _.map(value, item => {
                const { id_applicant, applicant_status } = item;
                console.log(id_applicant);
                if(id_applicant !== null) {
                    if (applicant_status === 0) {
                        candidates++;
                    }
                    else {
                        participants++;
                    }
                }                
            })

            const temp = {
                id_job: value[0].id_job,
                employer: value[0].employer,
                title: value[0].title,
                salary: value[0].salary,
                job_topic: value[0].job_topic,
                area_province: value[0].area_province,
                area_district: value[0].area_district,
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
                requirement: value[0].requirement,
                id_status: value[0].id_status,
                candidates: candidates,
                participants: status === 2 || status === 3 ? value[0].candidates : participants,
                deadline: value[0].deadline,
                start_date: value[0].start_date,
                end_date: value[0].end_date,
                salary_type: value[0].salary_type,
                province: value[0].province,
                district: value[0].district,
            }
            finalData.push(temp);
        })

        finalData = _.orderBy(finalData, 'post_date', 'desc');        
        // Đảo ngược chuỗi vì id_job thêm sau cũng là mới nhất
        // if (isASC !== 1) {
        //     finalData = _.groupBy(data, 'post_date', 'desc');
        // }

        let realData = finalData.slice((page - 1) * take, (page - 1) * take + take);
        
        response(res, DEFINED_CODE.GET_DATA_SUCCESS, { jobList: realData, total: finalData.length, page: page });

    }).catch((err) => {
        console.log(err);
        response(res, DEFINED_CODE.GET_DATA_FAIL, err);
    })
});

// Get jobs by employer id and status
router.post('/getJobsByEmployerId', function (req, res, next) {
    let page = Number.parseInt(req.body.page) || 1;
    let take = Number.parseInt(req.body.take) || 6;
    let isASC = Number.parseInt(req.body.isASC) || 1;
    let status = Number.parseInt(req.body.status) || 1;
    console.log(status);
    console.log(req.body.status);
    var token = req.headers.authorization.slice(7);
    var decodedPayload = jwt.decode(token, {
        secret: 'S_Team',
    });
    let employer = decodedPayload.id;
    jobModel.getJobsByEmployerId(employer, status).then(data => {
        console.log("Status: " + status);
        let finalData = data;
        // console.log('data:', data)
        finalData = _.orderBy(finalData, 'post_date', 'desc');
        // if (isASC !== 1) {
        //     finalData = _.groupBy(data, 'post_date', 'desc');
        // }
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
                    jobTopicModel.updateJobsCount(job.job_topic, true)
                        .then(finalResult => {
                            response(res, DEFINED_CODE.CREATED_DATA_SUCCESS, "Job added, count increased");
                        }).catch(err => {
                            response(res, DEFINED_CODE.CREATE_DATA_FAIL, err);
                        })
                    // response(res, DEFINED_CODE.CREATED_DATA_SUCCESS, data);
                }).catch((err) => {
                    response(res, DEFINED_CODE.CREATE_DATA_FAIL, err);
                    // res.json(err);
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
                districtProvinceModel.addArea(pro, dis, false)
                    .then(newDis => {
                        districtProvinceModel.getDisById(newDis.results2.insertId)
                            .then(disData => {
                                job.area_province = disData[0].id_province;
                                job.area_district = disData[0].id_district;
                                jobModel.addJob(job).then(data => {
                                    jobTopicModel.updateJobsCount(job.job_topic, true)
                                        .then(finalResult => {
                                            response(res, DEFINED_CODE.CREATED_DATA_SUCCESS, "Job added, count increased");
                                        }).catch(err => {
                                            response(res, DEFINED_CODE.CREATE_DATA_FAIL, err);
                                        })
                                    // response(res, DEFINED_CODE.CREATED_DATA_SUCCESS, data);
                                }).catch((err) => {
                                    response(res, DEFINED_CODE.CREATE_DATA_FAIL, err);
                                    // res.json(err);
                                })
                            }).catch(err => {
                                response(res, DEFINED_CODE.CREATE_DATA_FAIL, err);
                                // res.json(err);
                            })
                    }).catch(err => {
                        response(res, DEFINED_CODE.CREATE_DATA_FAIL, err);
                        // res.json(err);
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
                            jobTopicModel.updateJobsCount(job.job_topic, true)
                                .then(finalResult => {
                                    response(res, DEFINED_CODE.CREATED_DATA_SUCCESS, "Job added, count increased");
                                }).catch(err => {
                                    response(res, DEFINED_CODE.CREATE_DATA_FAIL, err);
                                })
                            response(res, DEFINED_CODE.CREATED_DATA_SUCCESS, data);
                        }).catch((err) => {
                            response(res, DEFINED_CODE.CREATE_DATA_FAIL, err);
                            // res.json(err);
                        })
                    }).catch(err => {
                        response(res, DEFINED_CODE.CREATE_DATA_FAIL, err);
                        // res.json(err);
                    })
            }
        }).catch(err => {
            // console.log(err);
            response(res, DEFINED_CODE.GET_DATA_FAIL, err);
            // res.json(err);
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
// router.delete("/deleteJob", function (req, res, next) {
//     let id_job = JSON.parse(JSON.stringify(req.body.id_job));;
//     if (id_job) {
//         jobModel.getJobById(id_job).then(result => {
//             //Existed
//             if (result.id_job) {
//                 jobModel.deleteJobById(id_job).then(data => {
//                     response(res, DEFINED_CODE.INTERACT_DATA_SUCCESS);
//                     let content = {
//                         fullname: data[1][0].fullname,
//                         job: data[1][0].title,
//                         type: 10,
//                         date: Date.now()
//                     }
//                     data[2].forEach((e) => {
//                         firebase.pushNotificationsFirebase(e.email, content);
//                     })

//                 }).catch((err) => {
//                     console.log('err:', err)
//                     response(res, DEFINED_CODE.INTERACT_DATA_FAIL, err);
//                 })
//             }
//             else {
//                 response(res, DEFINED_CODE.ERROR_ID);

//             }
//         }).catch(err => {
//             response(res, DEFINED_CODE.INTERACT_DATA_FAIL, err);
//         })

//     }
//     else {
//         response(res, DEFINED_CODE.ERROR_ID);

//     }

// }),
router.post("/removeJob", function (req, res, next) {
    let id_job = JSON.parse(JSON.stringify(req.body.id_job));;
    if (id_job) {
        jobModel.checkIfExistJob(id_job).then(result => {
            //Existed
            if (result.length > 0) {
                jobModel.removeJobById(id_job).then(data => {
                    response(res, DEFINED_CODE.INTERACT_DATA_SUCCESS);
                    let content = {
                        fullname: data[1][0].fullname,
                        job: data[1][0].title,
                        type: 4,
                        date: Date.now()
                    }
                    data[2].forEach((e) => {
                        firebase.pushNotificationsFirebase(e.email, content);
                    })

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

}),
router.post("/createNewChatConversation", async function (req, res, next) {

    const { email1, email2 } = req.body;
    if (email1 && email2) {
        firebase.createConversation(email1, email2);

    }
    else
        response(res, DEFINED_CODE.ERROR_ID);



})
router.post("/sendMessage", async function (req, res, next) {

    const { email1, email2 } = req.body;
    if (email1 && email2) {
        firebase.sendMessage(email1, email2);

    }
    else
        response(res, DEFINED_CODE.ERROR_ID);



})
router.post("/cancelRecruit", function (req, res, next) {
    let id_job = req.body.id_job;
    if (id_job) {
        jobModel.setCancelRecruit(id_job).then(data => {
            response(res, DEFINED_CODE.INTERACT_DATA_SUCCESS, data);
            // gửi thông báo cho ng dc tuyển
            let content1 = {
                fullname: data[1][0].fullname,
                job: data[1][0].title,
                type: 5,
                date: Date.now()
            }
            data[2].forEach((e) => {
                firebase.pushNotificationsFirebase(e.email, content1);
            })
            let content2 = {
                fullname: data[1][0].fullname,
                id_job: id_job,
                job: data[1][0].title,
                type: 18,
                date: Date.now()
            }
            data[3].forEach((e) => {
                firebase.pushNotificationsFirebase(e.email, content2);
            })
        }).catch(err => {
            response(res, DEFINED_CODE.INTERACT_DATA_FAIL, err);
        })

    }
    else {
        response(res, DEFINED_CODE.ERROR_ID);

    }
})
router.post("/acceptApplicant", function (req, res, next) {
    let emailEmployer = '';
    if (!req.headers.authorization) {
        console.log("No token");
        response(res, DEFINED_CODE.NULL_TOKEN);
    }
    token = req.headers.authorization.slice(7);
    let decoded = jwt.decode(token, {
        secret: 'S_Team',
    });
    emailEmployer = decoded.email;
    let = nameEmployer = decoded.fullname;
    const { id_job, id_user, email, job_title } = req.body;

    if (id_job && id_user && email && emailEmployer ) {
        jobModel.acceptApplicant(id_job, id_user).then(data => {
            response(res, DEFINED_CODE.INTERACT_DATA_SUCCESS, data);
            if(data[2].participants === data[3].vacancy) {
                jobModel.updateJobStatus(id_job, 1).then(data2 => {
                    console.log('update status success');
                })
            }
            firebase.createConversation(emailEmployer, email);
            let content = {
                fullname: nameEmployer,
                id_job: id_job,
                job: job_title,
                type: 1,
                date: Date.now()
            }
            firebase.pushNotificationsFirebase(email, content)
        }).catch(err => {
            response(res, DEFINED_CODE.INTERACT_DATA_FAIL, err);

        })

    }
    else {
        response(res, DEFINED_CODE.ERROR_ID);

    }
});
router.post("/rejectApplicant", function (req, res, next) {
    if (!req.headers.authorization) {
        console.log("No token");
        response(res, DEFINED_CODE.NULL_TOKEN);
    }
    token = req.headers.authorization.slice(7);
    let decoded = jwt.decode(token, {
        secret: 'S_Team',
    });
    let nameEmployer = decoded.fullname;
    const { id_job, id_user, isEmployer} = req.body;
    if (id_job && id_user) {
        jobModel.rejectApplicant(id_job, id_user, isEmployer).then(data => {
            response(res, DEFINED_CODE.INTERACT_DATA_SUCCESS, data[0]);
            let content = {
                fullname: nameEmployer,
                id_job: id_job,
                job: data[1][0].title,
                type: isEmployer === 1 ? 0 : 17,
                date: Date.now()
            }
            firebase.pushNotificationsFirebase(data[1][0].email, content);
        }).catch(err => {
            response(res, DEFINED_CODE.INTERACT_DATA_FAIL, err);

        })

    }
    else {
        response(res, DEFINED_CODE.ERROR_ID);

    }
})
router.post("/finishJob", function (req, res, next) {
    if (!req.headers.authorization) {
        console.log("No token");
        response(res, DEFINED_CODE.NULL_TOKEN);
    }
    token = req.headers.authorization.slice(7);
    let decoded = jwt.decode(token, {
        secret: 'S_Team',
    });
    let nameEmployer = decoded.fullname;
    const { id_job, job_title } = req.body;
    if (id_job && job_title) {
        let content = {
            fullname: nameEmployer,
            job: job_title,
            type: 2,
            date: Date.now()
        }
        jobModel.finishJob(id_job).then(rs => {
            applicantModel.getApplicantsByJobId(id_job, 5).then(data => {
                console.log('data:', data);
                data.forEach(element => {
                    firebase.pushNotificationsFirebase(element.email, content)

                })
            })
            response(res, DEFINED_CODE.INTERACT_DATA_SUCCESS, rs);


        }).catch(err => {
            response(res, DEFINED_CODE.INTERACT_DATA_FAIL, err);

        })

    }
    else {
        response(res, DEFINED_CODE.ERROR_ID);

    }
})
module.exports = router;
