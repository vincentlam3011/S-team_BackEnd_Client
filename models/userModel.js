var db = require('../utils/db');

module.exports = {
    getByEmail: (email) => {
        return db.query(`select * from users where email = '${email}';`);
    },
    getByID: (id) => {
        return db.query(`select * from users where id = ${id}`);
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
}
