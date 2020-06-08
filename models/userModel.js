var db = require('../utils/db');

module.exports = {
    getByEmail: (email, accStatus = 0) => {
        if (accStatus === 0)
            return db.query(`select id_user, fullname, dob, email, password, dial, address, isBusinessUser, gender, account_status, currentToken, activationToken, activationExpr from users where email = '${email}';`);
        else if (accStatus === 1)
            return db.query(`select id_user, fullname, dob, email, password, dial, address, isBusinessUser, gender, account_status, currentToken, activationToken, activationExpr from users where email = '${email}' and account_status = ${accStatus};`);
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

        // var sqlQueryCompanies = `insert into COMPANIEs` + columnsCompanies + ` values` + valuesCompanies + `;`;
        return db.transaction(sqlQueryUsers, columnsCompanies, valuesCompanies, `COMPANIEs`);
    },
    editToken: (id, token) => {
        console.log('token in edit token:', token)
        return db.query(`update users set currentToken = '${token}' where id_user = ${id}`);
    },
    getCurrentToken: (id) => {
        return db.query(`select currentToken from users where id_user = ${id}`);
    },
    getTopUsers: () => {
        return db.query(`select u.fullname,u.address,u.dial,u.email,u.avatarImg,j.*,AVG(ac.rating_fromEmployer) as rating from accepted as ac,users as u, applicants as ap, jobs as j
        where ac.id_applicant = ap.id_applicant and ap.id_user = u.id_user and ap.id_job= j.id_job
        GROUP BY u.id_user
        ORDER BY AVG(ac.rating_fromEmployer) DESC
        LIMIT 5;`)
    },
    getUserInfo: (id) => {
        var userQuery = `select * from USERs where id_user = ${id};`;
        var companyQuery = `select * from COMPANIEs where id_user = ${id};`;
        return db.query(userQuery + ' ' + companyQuery);
    },
    countUsers: () => {
        return db.query(`select count(*) as memberNum from users where account_status = 1 or account_status = 2`)
    },
    updateUserInfo: (id, updates) => {
        var updateQuery = `update users set `;
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
        return db.query(`select id_user, account_status, activationToken, timestampdiff(second, activationExpr, now()) as isExpr from users where activationToken = '${token}';`);
    }
}
