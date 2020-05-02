var db = require('../utils/db');

module.exports = {
    getByEmail: (email) => {
        return db.query(`select * from users where email = '${email}';`);
    },
    getByID: (id) => {
        return db.query(`select * from users where id = ${id}`);
    },
    sign_up: (account) => {
        var columns = `(email, password)`;
        var values = `('${account.email}', '${account.password}')`;
        var sqlQuery = `insert into USERs` + columns + ` values` + values + `;`;
        return db.query(sqlQuery);
    }
}