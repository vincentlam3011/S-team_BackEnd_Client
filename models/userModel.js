var db = require('../utils/db');
var convertBlobB64 = require('../middleware/convertBlobB64');

module.exports = {    
    getByEmail: (email, accStatus = 0) => {
        if (accStatus === 0)
            return db.query(`select id_user, fullname, dob, email, password, dial, address, isBusinessUser, gender, account_status, currentToken, activationToken, activationExpr from users where email = '${email}';`);
        else if (accStatus === 1) {
            return db.query(`select id_user, fullname, dob, email, password, dial, address, isBusinessUser, gender, account_status, currentToken, activationToken, activationExpr from users where email = '${email}' and account_status > 0;`);
        }
        else if (accStatus === -1) {
            return db.query(`select id_user, fullname, dob, email, password, dial, address, isBusinessUser, gender, account_status, currentToken, activationToken, activationExpr from users where email = '${email}' and account_status = 0;`);
        }

    },
    getByID: (id) => {
        return db.query(`select * from users where id_user = ${id}`);
    },
    sign_up: (account, company) => {
        var columnsUsers = `(email, password, fullname, dob, dial, address, isBusinessUser, gender, account_status, activationToken, activationExpr)`;
        var valuesUsers = `('${account.email}', '${account.password}', '${account.fullname}', '${account.dob}', '${account.dial}', '${account.address}' 
                            ,${account.isBusinessUser}, ${account.gender}, ${account.account_status}, '${account.activationToken}', '${account.activationExpr}')`;

        var sqlQueryUsers = `insert into users` + columnsUsers + ` values` + valuesUsers + `;`;
        if (company === null) {
            return db.query(sqlQueryUsers);
        }
        var columnsCompanies = `(id_user, company_name, position, company_address, company_email, number_of_employees)`;
        var valuesCompanies = `, '${company.company_name}', '${company.position}', '${company.company_address}'
                                        ,'${company.company_email}', ${company.number_of_employees})`;
        return db.transaction(sqlQueryUsers, columnsCompanies, valuesCompanies, `companies`);
    },
    editToken: (id, token) => {
        console.log('token in edit token:', token)
        return db.query(`update users set currentToken = '${token}' where id_user = ${id}`);
    },
    getCurrentToken: (id) => {
        return db.query(`select currentToken from users where id_user = ${id}`);
    },
    getTopUsers: () => {
        return db.query(`select u.id_user, u.fullname,u.address,u.dial,u.email,u.avatarImg,j.*,AVG(ac.rating_fromEmployer) as rating from accepted as ac,users as u, applicants as ap, jobs as j
        where ac.id_applicant = ap.id_applicant and ap.id_user = u.id_user and ap.id_job= j.id_job
        GROUP BY u.id_user
        ORDER BY AVG(ac.rating_fromEmployer) DESC
        LIMIT 5;`)
    },
    getUserInfo: (id) => {
        var userQuery = `select * from users where id_user = ${id};`;
        var companyQuery = `select * from companies where id_user = ${id};`;
        return db.query(userQuery + ' ' + companyQuery);
    },
    getUserInfoNotPrivate: (id) => {
        let userQuery = '', employerRatingQuery = '', employeeRatingQuery = '', companyQuery = '';
        userQuery = `select id_user, fullname, dob, email, dial, address, identity, isBusinessUser, gender, avatarImg, account_status from users where id_user = ${id};`;        
        employeeRatingQuery = `select COALESCE(AVG(ac.rating_fromEmployee),0) as employer_rating, count(*) as employee_job from accepted  as ac, applicants as ap where ac.id_applicant = ap.id_applicant and ap.id_user = ${id};`;
        employerRatingQuery = `select COALESCE(AVG(ac.rating_fromEmployer),0) as employee_rating, count(*) as employer_job from accepted as ac, jobs as j where ac.id_job = j.id_job and j.employer = ${id};`;
        companyQuery = `select * from companies where id_user = ${id};`;        
        return db.query(userQuery + ' ' + employerRatingQuery + ' ' + employeeRatingQuery + ' ' + companyQuery);
    },
    countUsers: () => {
        return db.query(`select count(*) as memberNum from users where account_status = 1 or account_status = 2`)
    },
    updateUserInfo: (id, updates) => {
        var updateQuery = `update users set `;
        for (i = 0; i < updates.length; i++) {
            if (updates[i].field === "avatarImg" || updates[i].field === "portrait" || updates[i].field === "frontIdPaper" || updates[i].field === "backIdPaper") {
                updates[i].value = convertBlobB64.convertB64ToBlob(updates[i].value).toString('hex');
                updateQuery += updates[i].field + ` = ` + `x'` + updates[i].value + `'`;
            } else {
                updateQuery += updates[i].field + ' = ' + updates[i].value;
            }
            if (i < (updates.length - 1)) {
                updateQuery += ',';
            }
        }
        console.log(updateQuery);
        var sqlQuery = updateQuery + ` where id_user = ${id}`;
        return db.query(sqlQuery);
    },
    updateCompanyInfo: (id, updates) => {
        var updateQuery = `update companies set `;
        for (i = 0; i < updates.length; i++) {
            updateQuery += updates[i].field + ' = ' + updates[i].value;
            if (i < (updates.length - 1)) {
                updateQuery += ',';
            }
        }
        console.log(updateQuery);
        var sqlQuery = updateQuery + ` where id_user = ${id}`;
        return db.query(sqlQuery);
    },
    verifyActivation: (token) => {
        return db.query(`select id_user, email, account_status, activationToken, timestampdiff(second, activationExpr, now()) as isExpr from users where activationToken = '${token}';`);
    },
    getUserImageFromChat: (email1,email2)=>{
        return db.query(`select email,avatarImg,fullname from users where users.email = "${email1}" or users.email = "${email2}";`);
    },
    getExpireJobList: (id_user) => {
        let today = new Date();
        let todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
        let sqlQuery = `
        select * from jobs where expire_date <= '${todayStr}' and employer = ${id_user} and id_status = 1;
        select * from ((jobs as j left join jobs_temporal as jt on j.id_job = jt.id_job) left join jobs_production as jp on j.id_job = jp.id_job) where (jp.deadline <= '${todayStr}' or jt.end_date <= '${todayStr}') and j.employer = ${id_user} and j.id_status = 2;
        `;
        return db.query(sqlQuery);
    },
    setExpireApplyingJobToProccessing: (id_user) => { // các công việc đang tuyển qua hạn nhưng có người ứng tuyển
        let today = new Date();
        let todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
        let sqlQuery = `
        update jobs 
        set id_status = -1 
        where id_job in (
            select j.id_job
            from jobs as j left join (select id_job, count(id_job) as count from applicants group by id_job) as t on j.id_job = t.id_job
                where t.count is null and j.expire_date <= '${todayStr}' and j.employer = ${id_user} and j.id_status = 1
                group by j.id_job
            );
            
        update jobs 
        set id_status = 4
        where id_job in (
            select j.id_job
            from jobs as j left join (select id_job, count(id_job) as count from applicants group by id_job) as t on j.id_job = t.id_job
                where t.count is not null and j.expire_date <= '${todayStr}' and j.employer = ${id_user} and j.id_status = 1
                group by j.id_job
            );
        `;
        return db.query(sqlQuery);
    },
    setFinishJob: (id_user) => {
        let today = new Date();
        let todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
        let sqlQuery = `
        select email, fullname from users where id_user = ${id_user};
        select u.email, j.title from users as u, applicants as app, ((jobs as j left join jobs_temporal as jt on j.id_job = jt.id_job) left join jobs_production as jp on j.id_job = jp.id_job) where j.employer = ${id_user} and j.id_job = app.id_job and app.id_user = u.id_user and (jp.deadline <= '${todayStr}' or jt.end_date <= '${todayStr}') and j.id_status = 2 ;
        update jobs 
        set id_status = 3 
        where set id_job = (select j.id_job
            from jobs as j, jobs_temporal as jt, jobs_production as jp 
            where j.id_job = jt.id_job and j.id_job = jp.id_job and (jp.deadline <= '${todayStr}' or jt.end_date <= '${todayStr}') and j.employer = ${id_user} and j.id_status = 2
            ));        
        `;
        return db.query(sqlQuery);
    }
}
