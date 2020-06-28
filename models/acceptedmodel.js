var db = require('../utils/db');
var convertBlobB64 = require('../middleware/convertBlobB64');

module.exports = {

    reviewFromEmployer: (review)=>{
        return db.query(`update accepted set feedback_fromEmployer='${review.feedback_fromEmployer}', rating_fromEmployer=${review.rating_fromEmployer}
        where id_applicant = ${review.id_applicant} and id_job=${review.id_job} `);
    },
   

    reviewReviewFromEmployee: (review)=>{
        return db.query(`update accepted set feedback_fromEmployee='${review.feedback_fromEmployee}', rating_fromEmployee=${review.rating_fromEmployee}
        where id_applicant = ${review.id_applicant} and id_job=${review.id_job} `);
    },
   
    getReviewListByJobId: (id_job) => {
        return db.query(`select ac.* from accepted as ac where ac.id_job = ${id_job}`);
    },

    getReviewListByEmployerId: (employer) => {
        return db.query(`select ac.*, j.title, u.avatarImg, u.fullname, u.email from accepted as ac, jobs as j, users as u, applicants as ap where u.id_user = ap.id_user and ap.id_applicant = ac.id_applicant and ac.id_job = j.id_job and j.employer = ${employer} order by ac.id_applicant desc`);
    },

    getReviewListByEmployeeId: (employee) => {
        return db.query(`select ac.*, j.title, u.avatarImg, u.fullname, u.email from accepted as ac, applicants as ap, users as u, jobs as j where ac.id_applicant = ap.id_applicant and ap.id_user = ${employee} and ac.id_job = j.id_job and u.id_user = j.employer order by ac.id_applicant desc`);
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
