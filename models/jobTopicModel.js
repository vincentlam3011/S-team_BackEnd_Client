var db = require('../utils/db');

module.exports = {
    getAllJobTopics: () => {
        return db.query(`select * from job_topics;`);
    },
    getJobTopicsForIOS: () => {
        return db.query(`select id_jobtopic, name, count from job_topics;`);
    },
    getJobTopicsByID: (id) => {
        return db.query(`select * from job_topics where id_jobtopic = ${id}`);
    },
    
}
