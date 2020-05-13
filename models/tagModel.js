var db = require('../utils/db');

module.exports = {
    getAllTags: () => {
        return db.query(`select * from tags;`);
    },
    getTagById: (id) => {
        return db.query(`select * from tags where id_tag= ${id};`);
    },
    
}
