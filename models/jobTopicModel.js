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
    updateJobsCount: (id, isIncrease = true) => {
        if (isIncrease) {
            let updateQuery = `update job_topics set count = count + 1 where id = ${id}; `
            let disableTriggerQuery = `SET @disable_triggers := 1; `
            let enableTriggerQuery = `SET @disable_triggers := 0; `
            return db.query(disableTriggerQuery + updateQuery + enableTriggerQuery);
        } else {
            return db.query(`update job_topics set count = count - 1 where id = ${id};`)
        }
    }
}
