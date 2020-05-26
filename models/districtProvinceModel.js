var db = require('../utils/db');

module.exports = {
    getAllDisTricts: (id_province) => {
        return db.query(`select * from districts where id_province=${id_province};`);
    },
    getAllProvinces: () => {
        return db.query(`select * from provinces;`);
    },

}
