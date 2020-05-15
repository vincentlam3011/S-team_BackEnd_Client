var db = require('../utils/db');

module.exports = {
    getByEmail: (email, accStatus = 0) => {
        if (accStatus === 0)
            return db.query(`select * from users where email = '${email}';`);
        else if (accStatus === 1)
            return db.query(`select * from users where email = '${email}' and account_status = ${accStatus};`);

    },
    getByID: (id) => {
        return db.query(`select * from users where id_user = ${id}`);
    },
    sign_up: (account, company) => {
        var columnsUsers = `(email, password, fullname, dob, dial, address, isBusinessUser, gender, account_status)`;
        var valuesUsers = `('${account.email}', '${account.password}', '${account.fullname}', '${account.dob}', '${account.dial}', '${account.address}' 
                            ,${account.isBusinessUser}, ${account.gender}, ${account.account_status})`;

        var sqlQueryUsers = `insert into USERs` + columnsUsers + ` values` + valuesUsers + `;`;
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
        return db.query(`update USERs set currentToken = '${token}' where id_user = ${id}`);
    },
    getCurrentToken: (id) => {
        return db.query(`select currentToken from USERs where id_user = ${id}`);
    },
    getCompanyInfo: () => {
        return db.query(`select * from users as U, companies as C where U.id_user = C.id_user`);
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
    }
}
