var db = require('../utils/db');
var convertBlobB64 = require('../middleware/convertBlobB64');

module.exports = {
    addJob: (job) => {
        let images = job.images;
        let tags = job.tags;
        console.log("Tags"); console.log(tags);
        let columsJob = `(employer,title,salary,job_topic,area_province,area_district,address,lat,lng,description,expire_date,dealable,job_type,isOnline,isCompany,vacancy,requirement,id_status,benefit)`
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
        '1',
        '${job.benefit}')`;
        let sqlQueryJobs = `insert into jobs` + columsJob + ` values` + valueJob + `;`;

        console.log("Job type   " + job.job_type);
        let querySubJob = ``;
        if (job.job_type == 0) {
            querySubJob = `insert into jobs_temporal values((select max(id_job) from jobs), null,'${job.start_date}', '${job.end_date}');`
        } else {
            querySubJob = `insert into jobs_production values((select max(id_job) from jobs), '${job.end_date}');`
        }

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

                    queryJobTags += "insert into jobs_tags values((SELECT MAX(id_job) FROM jobs)" + ",'" + element.id_tag + "');";
                    // console.log('queryJobRealtedImages:', queryJobRealtedImages);
                });
            }
            return db.query(sqlQueryJobs + queryJobRealtedImages + queryJobTags + querySubJob);
        }
        else {
            return db.query(sqlQueryJobs + querySubJob);
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
                    queryJobRealtedImages += `insert into job_related_images values(${job.id_job}, x'${element}');`;
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
        let query1 = `select  distinct  j.*,p.name as province_name, d.name as district_name, job_topics.name as topic_name, u.fullname as name_employer,u.email,u.dial,jt.id_tag,t.name as tag_name, t.status as tag_status, s.name as name_status,  jtp.start_date,jtp.end_date,jtp.salary_type,jp.deadline
            from jobs as j 
            left join jobs_tags as jt
            on  j.id_job= jt.id_job
            left join tags as t on t.id_tag = jt.id_tag
			left join jobs_production as jp on jp.id_job = j.id_job
			left join jobs_temporal as jtp on jtp.id_job = j.id_job,
            statuses as s,users as u, provinces as p, districts as d, job_topics
            where j.id_job=${id} and s.id_status = j.id_status and u.id_user=j.employer and j.area_province = p.id_province and j.area_district = d.id_district and j.job_topic = job_topics.id_jobtopic;`

        let query2 = `select  distinct  j.id_job,jri.img
            from jobs as j 
            left join job_related_images as jri
            on  j.id_job= jri.id_job
            where j.id_job=${id};`

        let query3 = `select  distinct  j.id_job,app.proposed_price,u.fullname,u.id_user,u.dial,u.email
            from jobs as j 
            left join applicants as app
            on  j.id_job= app.id_job
            join users as u on u.id_user = app.id_user
            where j.id_job=${id};`
        
        return db.query(query1 + ` ` + query2 + ` ` + query3)
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
    getJobsList: (queryArr, multipleTags) => {
        let query = '', count = 0, tags = '';

        for (let e of queryArr) {
            if (count !== 0) {
                query += ' and';
            }
            query += ` j.${e.field} ${e.text}`;
            count++;
        }

        if (multipleTags.length > 0) {
            tags += multipleTags[0];
            multipleTags.forEach((e, i) => {
                if (i !== 0) {
                    tags += `, ${e}`;
                }
            })
        }
        let today = new Date();
        let todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
        let finalQuery = `
        select j.*, jri.img, jt.id_tag, t.name as tag_name, t.status as tag_status, p.name as province, d.name as district${multipleTags.length > 0 ? ', matches.relevance as relevance' : ''}
        from (((jobs as j left join job_related_images as jri on j.id_job = jri.id_job) left join jobs_tags as jt on j.id_job = jt.id_job) left join tags as t on t.id_tag = jt.id_tag), users as u, provinces as p, districts as d
        ${multipleTags.length > 0 ? ',(SELECT j2.id_job as id,count(j2.id_job) as relevance FROM jobs as j2, jobs_tags as jt2 WHERE j2.id_job = jt2.id_job AND jt2.id_tag IN (' + tags + ') GROUP BY j2.id_job) AS matches' : ''}
        ${queryArr.length > 0 ? ('where ' + query + ' and j.area_province = p.id_province and j.area_district = d.id_district and j.expire_date > "' + todayStr + '" ') : 'where j.area_province = p.id_province and j.area_district = d.id_district and j.expire_date > "' + todayStr + '" '} ${multipleTags.length > 0 ? ' and matches.id = j.id_job' : ''}
        group by j.id_job, jt.id_tag`
        // return db.query(`
        // select j.*, jri.img, jt.id_tag, t.name as tag_name, p.name as province, d.name as district
        // from (((jobs as j left join job_related_images as jri on j.id_job = jri.id_job) left join jobs_tags as jt on j.id_job = jt.id_job) left join tags as t on t.id_tag = jt.id_tag), users as u, provinces as p, districts as d, jobs_tags as jt1
        // ${queryArr.length > 0 ? ('where ' + query +' j.area_province = p.id_province and j.area_district = d.id_district') : 'j.area_province = p.id_province and j.area_district = d.id_district'}
        // group by j.id_job, jt.id_tag`);
        // console.log(finalQuery);
        return db.query(finalQuery);
    },
    getJobPostListForIOS: (job_type) => {
        let today = new Date();
        let todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
        return db.query(`
        select j.*, jri.img, p.name as province, d.name as district
        from (jobs as j left join job_related_images as jri on j.id_job = jri.id_job), provinces as p, districts as d
        where j.job_type = ${job_type} and j.area_province = p.id_province and j.area_district = d.id_district and j.expire_date > ${todayStr} 
        group by j.id_job`);
    },
    getJobsByApplicantId: (id_user, status) => {
        if (status === 1) {
            return db.query(`
            select j.*, u.fullname, u.email, u.dial, u.avatarImg, p.name as province, d.name as district, jp.deadline as deadline, jt.start_date as start_date, jt.end_date as end_date, jt.salary_type
            from ((jobs as j left join jobs_production as jp on j.id_job = jp.id_job) left join jobs_temporal as jt on j.id_job = jt.id_job), users as u, provinces as p, districts as d, applicants as a
            where j.id_job = a.id_job and a.id_user = ${id_user} and j.employer = u.id_user and j.area_province = p.id_province and j.area_district = d.id_district and j.id_status = ${status}
            group by j.id_job`);
        }
        else {
            return db.query(`
            select j.*, u.fullname, u.email, u.dial, u.avatarImg, p.name as province, d.name as district, jp.deadline as deadline, jt.start_date as start_date, jt.end_date as end_date, jt.salary_type
            from ((jobs as j left join jobs_production as jp on j.id_job = jp.id_job) left join jobs_temporal as jt on j.id_job = jt.id_job), users as u, provinces as p, districts as d, accepted as a
            where j.id_job = a.id_job and a.id_applicant = ${id_user} and j.employer = u.id_user and j.area_province = p.id_province and j.area_district = d.id_district and j.id_status = ${status}
            group by j.id_job`);
        }
    },
    getJobsByEmployerId: (id_user, status) => {
        if (status === 1) {
           
            return db.query(`
            select j.*, count(a.id_job) as candidates,jp.deadline as deadline, jt.start_date as start_date, jt.end_date as end_date, jt.salary_type, p.name as province, d.name as district
            from (((jobs as j left JOIN applicants as a on j.id_job = a.id_job) left join jobs_production as jp on j.id_job = jp.id_job) left join jobs_temporal as jt on j.id_job = jt.id_job), provinces as p, districts as d
            where j.employer = ${id_user} and j.id_status = ${status} and a.id_status=4 and j.area_province = p.id_province and j.area_district = d.id_district
            group by j.id_job`);
        }
        else {
            return db.query(`
            select j.*, count(a.id_job) as candidates,jp.deadline as deadline, jt.start_date as start_date, jt.end_date as end_date, jt.salary_type, p.name as province, d.name as district
            from (((jobs as j left JOIN accepted as a on j.id_job = a.id_job) left join jobs_production as jp on j.id_job = jp.id_job) left join jobs_temporal as jt on j.id_job = jt.id_job), provinces as p, districts as d
            where j.employer = ${id_user} and j.id_status = ${status} and j.area_province = p.id_province and j.area_district = d.id_district
            group by j.id_job`);
        }

    },
    // getJobsByEmployerId: (id_user, status) => {
    //     return db.query(`
    //     select j.*, jri.img, jt.id_tag, t.name as tag_name, p.name as province, d.name as district
    //     from (((jobs as j left join job_related_images as jri on j.id_job = jri.id_job) left join jobs_tags as jt on j.id_job = jt.id_job) left join tags as t on t.id_tag = jt.id_tag), users as u, provinces as p, districts as d
    //     where j.employer = ${id_user} and j.area_province = p.id_province and j.area_district = d.id_district and j.id_status = ${status}
    //     group by j.id_job, jt.id_tag`);
    // },
    countFinishedJob: () => {
        return db.query(`select count(*) as finishedJobNum from jobs where id_status = 2`);
    },
    countApplyingJob: () => {
        return db.query(`select count(*) as applyingJobNum from jobs where id_status = 1`);
    },
    countProcessingJob: () => {
        return db.query(`select count(*) as processingJobNum from jobs where id_status = 3`);
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
    setCancelRecruit: (id_job)=>{
        return db.query(`update jobs set id_status = 2 where id_job= ${id_job}`);
    },
    acceptApplicant:(id_job,id_user)=>{
   
        return db.query(`
        insert into accepted (id_applicant,id_job) SELECT * FROM (SELECT id_applicant,${id_job} from applicants where id_job=${id_job} and id_user=${id_user}) as tmp;
        update applicants set id_status = 5 where id_job =${id_job} and id_user=${id_user};
        `);
    },
    rejectApplicant:(id_job,id_user)=>{
        return db.query(`delete from applicants where id_job =${id_job} and id_user=${id_user} `);
    },
    finishJob: (id_job)=>{
        return db.query(`update jobs set id_status=3 where id_job=${id_job}`)
    }
}
