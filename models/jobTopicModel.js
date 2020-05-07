var db = require('../utils/db');

module.exports = {
    getAllJobTopics: () => {
        return db.query(`select * from job_topics;`);
    },
    getJobTopicsByID: (id) => {
        return db.query(`select * from job_topics where id_jobtopic = ${id}`);
    },
}
