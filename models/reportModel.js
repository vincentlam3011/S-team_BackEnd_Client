var db = require('../utils/db');

module.exports = {
    getReportByAppIdJobIdU1U2Type: (id_user1, id_user2, type, applicantId, jobId) => {
        let sqlQuery = `select * from reports where id_user1 = ${id_user1} and id_user2 = ${id_user2} and type = ${type} and id_applicant = ${applicantId} and id_job = ${jobId}`;
        console.log(sqlQuery);
        return db.query(sqlQuery);
    },
    addReport: (id_user1, role1, id_user2, role2, content, type, applicantId, jobId) => {
        let addReportQuery = `insert into reports (id_user1, role1, id_user2, role2, content, type, id_applicant, id_job) values (${id_user1},${role1}, ${id_user2}, ${role2}, N'${content}', ${type}, ${applicantId}, ${jobId})`;

        return db.query(addReportQuery);
    },
    updateContentReport: (id_user1, id_user2, content, type, applicantId, jobId) => {
        let sqlQuery = `update reports set content = N'${content}' where id_user1 =${id_user1} and id_user2 =${id_user2} and type =${type} and id_applicant =${applicantId} and id_job =${jobId}`;
        return db.query(sqlQuery);
    }
}
