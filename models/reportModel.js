var db = require('../utils/db');

module.exports = {
    addReport: (id_user1, role1, id_user2, role2, content, type, applicantId) => {
        let addReportQuery = `insert into reports (id_user1, role1, id_user2, role2, content, type, id_applicant) values (${id_user1},${role1}, ${id_user2}, ${role2}, N'${content}', ${type}, ${applicantId})`;

        return db.query(addReportQuery);
    },
}
