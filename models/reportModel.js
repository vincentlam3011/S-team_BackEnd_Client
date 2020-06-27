var db = require('../utils/db');

module.exports = {
    addReport: (id_user1, role1, id_user2, role2, content) => {
        let addReportQuery = `insert into reports (id_user1, role1, id_user2, role2, content) values (${id_user1},${role1}, ${id_user2}, ${role2}, N'${content}')`;
        
        return db.query(addReportQuery);
    },
}
