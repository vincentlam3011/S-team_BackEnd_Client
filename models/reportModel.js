var db = require('../utils/db');

module.exports = {
    getReportByAppIdJobIdU1U2Type: (id_user1, id_user2, type, applicantId, jobId) => {
        let sqlQuery = `select * from reports where id_user1 = ${id_user1} and id_user2 = ${id_user2} and type = ${type} and id_applicant = ${applicantId} and id_job = ${jobId}`;
        return db.query(sqlQuery);
    },
    addReport: (id_user1, role1, id_user2, role2, content, type, applicantId, jobId) => {
        let addReportQuery = `
        insert into reports (id_user1, role1, id_user2, role2, content, type, id_applicant, id_job) values (${id_user1},${role1}, ${id_user2}, ${role2}, N'${content}', ${type}, ${applicantId}, ${jobId});
        select j.title, j.id_job, u1.fullname, u2.email from users as u1, users as u2, jobs as j where j.id_job = ${jobId} and u2.id_user = ${id_user2} and u1.id_user = ${id_user1};
        `;
        
        if(type === 1) { // yêu cầu sa thải thì phải update ngày sa thải lại
            let today = new Date();
            let todayStr = `${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`;
            addReportQuery += `update applicants set end = '${todayStr}' where id_applicant = ${applicantId};`;
        }

        return db.query(addReportQuery);
    },
    updateContentReport: (id_user1, id_user2, content, type, applicantId, jobId) => {
        let sqlQuery = `update reports set content = N'${content}' where id_user1 =${id_user1} and id_user2 =${id_user2} and type =${type} and id_applicant =${applicantId} and id_job =${jobId}`;
        return db.query(sqlQuery);
    }
}
