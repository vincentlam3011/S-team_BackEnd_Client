var db = require('../utils/db');
var convertBlobB64 = require('../middleware/convertBlobB64');

module.exports = {
    addJob: (job) => {
        let images = job.images;
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
        '${job.id_status}')`;
        let sqlQueryJobs = `insert into Jobs` + columsJob + ` values` + valueJob + `;`;
        if (images) {
                let queryJobRealtedImages = '';
                images.forEach(element => {
                    element = convertBlobB64.convertB64ToBlob(element).toString('hex');
                    queryJobRealtedImages += "insert into job_related_images values((SELECT MAX(id_job) FROM jobs)" + ",x'" + element + "');";
                    // console.log('queryJobRealtedImages:', queryJobRealtedImages);
                });
         
                return db.query(sqlQueryJobs+queryJobRealtedImages)
        }
        else
        {
            return db.query(sqlQueryJobs)
        }

    },
    editJob: (job) => {
        let columsJob = `(title,salary,job_topic,area_province,area_district,address,lat,lng,description,expire_date,dealable,job_type,isOnline,isCompany,vacancy,requirement,id_status)`
        let valueJob = `(
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
        '${job.id_status}')`
        let sqlQueryUsers = `update Jobs SET title ='${job.title}',salary='${job.salary}',
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
        id_status='${job.id_status}' WHERE id_job = '${job.id_job}'`
        console.log('sqlQueryUsers:', sqlQueryUsers);
        return db.query(sqlQueryUsers);


    },
    getJobById: (id) => {
        return db.query(`select * from jobs where id_job = ${id}`);
    },
    getJobByIdJobTopic: (id) => {
        return db.query(`select * from jobs where job_topic = ${id}`);
    },
    deleteJobById: (id) => {
        return db.query(`delete from jobs where id_job = ${id}`)
    }
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
