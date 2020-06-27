var db = require('../utils/db');
var convertBlobB64 = require('../middleware/convertBlobB64');

module.exports = {

    reviewFromEmployer: (review)=>{
        return db.query(`update from accepted set feedback_fromEmployer='${review.feedback_fromEmployer}', rating_fromEmployer=${review.rating_fromEmployer}
        where id_applicant = ${review.id_applicant} and id_job=${review.id_job} `);
    },
   

    reviewReviewFromEmployee: (review)=>{
        return db.query(`update from accepted set feedback_fromEmployee='${review.feedback_fromEmployee}', rating_fromEmployee=${review.rating_fromEmployee}
        where id_applicant = ${review.id_applicant} and id_job=${review.id_job} `);
    },
   
    getReviewListByJobId: (id_job) => {
        return db.query(`select ac.* from accepted as ac where ac.id_job = ${id_job}`);
    },

    getReviewListByEmployerId: (employer) => {
        return db.query(`select ac.* from accepted as ac, jobs as j where ac.id_job = j.id_job and j.employer = ${employer}`);
    },

    getReviewListByEmployeeId: (employee) => {
        return db.query(`select ac.* from accepted as ac where ac.id_applicant = ${employee}`);
    },
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
