var db = require('../utils/db');

module.exports = {
    getAllJobTopics: () => {
        return db.query(`select * from job_topics where status = 1;`);
    },
    getJobTopicsForIOS: () => {
        return db.query(`select id_jobtopic, name, count from job_topics where status = 1;`);
    },
    getJobTopicsByID: (id) => {
        return db.query(`select * from job_topics where id_jobtopic = ${id} where status = 1`);
    },
    
}
