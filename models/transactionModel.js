var db = require('../utils/db');
var convertBlobB64 = require('../middleware/convertBlobB64');

module.exports = {

    insertIntoTransaction: (trans)=>{
        return db.query(`amount, requestId, orderId, orderInfo, orderType, transId, errorCode, message, localMessage, responseTime, signature,  extraData, payType, id_applicant) 
        VALUES ('${trans.amount}','${trans.requestId}','${trans.orderId}','${trans.orderInfo}','${trans.orderType}','${trans.transId}','${trans.errorCode}','${trans.message}','${trans.localMessage}','${trans.responseTime}','${trans.signature}','${trans.extraData}','${trans.payType}','${trans.id_applicant}');`);
    },
   
    getTransactions: (trans)=>{
        return db.query(`select t.* from transactions as t, applicants as a,jobs as j`)
    },
    getTransactionsByIdApplicant: (id_applicant)=>{
        return db.query(`select distinct t.* from transactions as t, applicants as a where t.id_applicant = ${id_applicant}`);
    }
  
    // sign_up: (account, company) => {
    //     let columnsUsers = `(email, password, fullname, dob, dial, address, isBusinessUser, gender, account_status)`;
    //     let valuesUsers = `('${account.email}', '${account.password}', '${account.fullname}', '${account.dob}', '${account.dial}', '${account.address}' 
    //                         ,${account.isBusinessUser}, ${account.gender}, ${account.account_status})`;

    //     let sqlQueryUsers = `insert into USERs` + columnsUsers + ` values` + valuesUsers + `;`;
    //     if (company === null) {
    //         return db.query(sqlQueryUsers);
    //     }
    //     let columnsCompanies = `(id_user, company_name, position, company_address, company_email, number_of_employees)`;
    //     let valuesCompanies = `, '${company.company_name}', '${company.position}', '${company.company_address}'
    //                                     ,'${company.company_email}', ${company.number_of_employees})`;

    //     // var sqlQueryCompanies = `insert into COMPANIEs` + columnsCompanies + ` values` + valuesCompanies + `;`;
    //     return db.transaction(sqlQueryUsers, columnsCompanies, valuesCompanies, `COMPANIEs`);
    // },
}
