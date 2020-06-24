var db = require('../utils/db');

module.exports = {
    getAllTags: () => {
        return db.query(`select * from tags and status = 1;`);
    },
    getTagById: (id) => {
        return db.query(`select * from tags where id_tag= ${id} and status = 1;`);
    },
    
}
