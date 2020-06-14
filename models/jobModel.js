var db = require('../utils/db');
var convertBlobB64 = require('../middleware/convertBlobB64');

module.exports = {
    addJob: (job) => {
        let images = job.images;
        let tags = job.tags;
        let columsJob = `(employer,title,salary,job_topic,area_province,area_district,address,lat,lng,description,expire_date,dealable,job_type,isOnline,isCompany,vacancy,requirement,id_status)`
        let valueJob = `('${job.employer}',
        '${job.title}','${job.salary}',
        '${job.job_topic}',
        '${job.area_province}',
        '${job.area_district}',
        '${job.address}','${job.lat}',
        '${job.lng}','${job.description}',
        '${job.expire_date}',${job.dealable},
        ${job.job_type},${job.isOnline},
        ${job.isCompany},
        '${job.vacancy}',
        '${job.requirement}',
        '1')`;
        let sqlQueryJobs = `insert into jobs` + columsJob + ` values` + valueJob + `;`;

        if (images || tags) {
            let queryJobRealtedImages = '';
            let queryJobTags = '';
            if (images) {
                images.forEach(element => {
                    element = convertBlobB64.convertB64ToBlob(element).toString('hex');
                    queryJobRealtedImages += "insert into job_related_images values((SELECT MAX(id_job) FROM jobs)" + ",x'" + element + "');";
                });
            }
            if (tags) {
                tags.forEach(element => {

                    queryJobTags += "insert into jobs_tags values((SELECT MAX(id_job) FROM jobs)" + ",'" + element.tag_id + "');";
                    // console.log('queryJobRealtedImages:', queryJobRealtedImages);
                });
            }
            return db.query(sqlQueryJobs + queryJobRealtedImages + queryJobTags)
        }
        else {
            return db.query(sqlQueryJobs)
        }

    },
    editJob: (job) => {
        let images = job.images;
        let tags = job.tags;

        let sqlQueryJobs = `update jobs SET title ='${job.title}',salary='${job.salary}',
        job_topic='${job.job_topic}',
        area_province='${job.area_province}',
        area_district='${job.area_district}',
        address='${job.address}',lat='${job.lat}',
        lng='${job.lng}',description='${job.description}',
        expire_date='${job.expire_date}',dealable=${job.dealable},
        job_type=${job.job_type},isOnline=${job.isOnline},
        isCompany=${job.isCompany},
        vacancy='${job.vacancy}',
        requirement='${job.requirement}',
        id_status='${job.id_status}' WHERE id_job = '${job.id_job}';`;
        if (images || tags) {
            let queryDeleteJobRealtedImages = '';
            let queryJobRealtedImages = '';
            let queryDeleteJobTags = '';
            let queryJobTags = '';
            if (images) {
                queryDeleteJobRealtedImages = `DELETE FROM job_related_images where id_job = ${job.id_job};`
                images.forEach(element => {
                    element = convertBlobB64.convertB64ToBlob(element).toString('hex');
                    queryJobRealtedImages += `insert into job_related_images values(${job.id_job},x'${element}');`;
                    // console.log('queryJobRealtedImages:', queryJobRealtedImages);
                });

            }
            if (tags) {
                queryDeleteJobTags = `DELETE FROM jobs_tags where id_job = ${job.id_job};`
                tags.forEach(element => {
                    queryJobTags += `insert into jobs_tags values(${job.id_job}` + ",'" + element.tag_id + "');";
                    // console.log('queryJobRealtedImages:', queryJobRealtedImages);
                });
                console.log('queryJobTags:', queryJobTags)
            }
            console.log('queryDeleteJobTags:', queryDeleteJobTags)
            return db.query(sqlQueryJobs + queryDeleteJobTags + queryDeleteJobRealtedImages + queryJobTags + queryJobRealtedImages);
        }
        else {
            return db.query(sqlQueryJobs)
        }



    },
    getJobById: (id) => {
        return new Promise((resolve, reject) => {
            let query = `select  distinct  j.*,pr.name as name_province,ds.name as name_district,u.fullname as name_employer,u.email,u.dial,jt.id_tag,t.name as tag_name,s.name as name_status,  jtp.start_date,jtp.end_date,jtp.salary_type,jp.deadline
            from jobs as j 
            left join jobs_tags as jt
            on  j.id_job= jt.id_job
            left join tags as t on t.id_tag = jt.id_tag
			left join jobs_production as jp on jp.id_job = j.id_job
            left join jobs_temporal as jtp on jtp.id_job = j.id_job
            left join provinces as pr on pr.id_province = j.area_province
            left join districts as ds on ds.id_district = j.area_district,
            statuses as s,users as u
       
            where j.id_job=${id} and s.id_status = j.id_status and u.id_user=j.employer;
            
            select  distinct  j.id_job,jri.img
            from jobs as j 
            left join job_related_images as jri
            on  j.id_job= jri.id_job
            where j.id_job=${id};
            
            select  distinct  j.id_job,app.proposed_price,u.fullname,u.id_user,u.dial,u.email
            from jobs as j 
            left join applicants as app
            on  j.id_job= app.id_job
            join users as u on u.id_user = app.id_user
            where j.id_job=${id};`
            db.query(query).then(data => {
                if (data[0]) {
                    let dataReturn = new Object(data[0][0]);
                    delete dataReturn.id_tag;
                    delete dataReturn.tag_name;
                    dataReturn.tags = [];
                    dataReturn.imgs = [];
                    dataReturn.dealers = [];

                    if (data[0]) {
                        data[0].forEach(element => {
                            if (element.id_tag) {
                                dataReturn.tags.push(
                                    element.tag_name
                                );
                            }

                        })
                    }
                    if (data[1]) {
                        data[1].forEach(element => {
                            if (element.img) {
                                let img = convertBlobB64.convertBlobToB64(element.img);
                                dataReturn.imgs.push(
                                    img
                                );
                            }

                        })
                    }
                    if (data[2]) {
                        data[2].forEach(element => {
                            // if (element.avatarImg) {
                            //     element.avatarImg = convertBlobB64.convertBlobToB64(element.avatarImg);
                            // }
                            dataReturn.dealers.push(element);
                        })
                    }

                    
                    resolve(dataReturn);
                }
                else resolve();

            }).catch(err => {
                console.log('err:', err)
                reject(err);
            })
        })
        // return db.query(`select * from jobs where id_job = ${id}`);
    },
    getJobByIdJobTopic: (id, page, number) => {
        return db.query(`select j.*,jri.img from jobs as j 
        left join job_related_images as jri
        on  j.id_job= jri.id_job
        where j.job_topic = ${id}
        group by jri.id_job 
        order by j.post_date DESC
        limit ${page * number},${number};`);
    },
    getJobsList:(queryArr) => {
        let query = '', count = 0;

        for(let e of queryArr)
        {
            if(count !== 0)
            {
                query += ' and';
            }
            query += ` j.${e.field} ${e.text}`;
            count++;
        }
        console.log(query);
        return db.query(`
        select j.*, jri.img, jt.id_tag, t.name as tag_name
        from (((jobs as j left join job_related_images as jri on j.id_job = jri.id_job) left join jobs_tags as jt on j.id_job = jt.id_job) left join tags as t on t.id_tag = jt.id_tag), users as u
        ${queryArr.length > 0 ? ('where ' + query) : '' }
        group by j.id_job, jt.id_tag`);
    },
    countFinishedJob: () => {
        return db.query(`select count(*) as finishedJobNum from jobs where id_status = 2`);
    },
    countUnfinishedJob: () => {
        return db.query(`select count(*) as unfinishedJobNum from jobs where id_status != 2`);
    },
    deleteJobById: (id) => {
        return db.query(`delete from jobs where id_job = ${id}`)
    },
    getJobsTemporalRecent: (number, page) => {
        return db.query(`select j.*,jri.img
        from jobs as j  LEFT JOIN job_related_images jri ON jri.id_job = j.id_job
        where j.isCompany = 0
		GROUP BY j.id_job
        order by j.post_date DESC limit ${page * number},${number}`);
    },
    getJobsCompanyRecent: (number, page) => {
        return db.query(`select j.*,jri.img
        from jobs as j  LEFT JOIN job_related_images jri ON jri.id_job = j.id_job
        where j.isCompany = 1
		GROUP BY j.id_job
        order by j.post_date DESC limit ${page * number},${number}`);
    },
    // sign_up: (account, company) => {
    //     let columnsUsers = `(email, password, fullname, dob, dial, address, isBusinessUser, gender, account_status)`;
    //     let valuesUsers = `('${account.email}', '${account.password}', '${account.fullname}', '${account.dob}', '${account.dial}', '${account.address}' 
    //                         ,${account.isBusinessUser}, ${account.gender}, ${account.account_status})`;

    //     let sqlQueryUsers = `insert into USERs` + columnsUsers + ` values` + valuesUsers + `;`;
    //     if (company === null) {
    //         return db.query(sqlQueryUsers);
    //     }
    //     let columnsCompanies = `(id_user, company_name, position, company_address, company_email, number_of_employees)`;
    //     let valuesCompanies = `, '${company.company_name}', '${company.position}', '${company.company_address}'
    //                                     ,'${company.company_email}', ${company.number_of_employees})`;

    //     // var sqlQueryCompanies = `insert into COMPANIEs` + columnsCompanies + ` values` + valuesCompanies + `;`;
    //     return db.transaction(sqlQueryUsers, columnsCompanies, valuesCompanies, `COMPANIEs`);
    // },

}
