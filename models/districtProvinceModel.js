var db = require('../utils/db');

module.exports = {
    getAllDisTricts: () => {
        return db.query(`select * from districts;`);
    },
    getAllProvinces: () => {
        return db.query(`select * from provinces;`);
    },

}
