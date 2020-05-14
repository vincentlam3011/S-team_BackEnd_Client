var db = require('../utils/db');
var convertBlobB64 = require('../middleware/convertBlobB64');

module.exports = {

    getApplicantsByJobId: (id) => {
        let sqlQueryApplicants = `SELECT A.*,U.fullname,U.email FROM APPLICANTS AS A, USERS AS U WHERE A.id_user = U.id_user and A.id_job= ${id}`;
        return db.query(sqlQueryApplicants);
    },
    getApplicantsByUserId: (id) => {
        let sqlQueryApplicants = `SELECT A.*,U.fullname,U.email FROM APPLICANTS AS A, USERS AS U WHERE A.id_user = U.id_user and A.id_user= ${id}`;
        return db.query(sqlQueryApplicants);
    },
    addApplicant: (applicants) => {
        applicants.attachment = convertBlobB64.convertB64ToBlob(applicants.attachment).toString('hex');
        let columsJob = `(id_user,id_job,proposed_price,attachment)`
        let valueJob = `('${applicants.id_user}',
        '${applicants.id_job}','${applicants.proposed_price}',
        x'${applicants.attachment}')`;
        let sqlQueryApplicants = `insert into Applicants` + columsJob + ` values` + valueJob + `;`;
        return db.query(sqlQueryApplicants)


    },
    editApplicant: (applicants) => {
        applicants.attachment = convertBlobB64.convertB64ToBlob(applicants.attachment).toString('hex');

        let sqlQueryApplicants = `update Applicants SET proposed_price ='${applicants.proposed_price}',attachment=x'${applicants.attachment}'
        WHERE id_applicant = '${applicants.id_applicant}';`;
        console.log('sqlQueryApplicants:', sqlQueryApplicants)
        return db.query(sqlQueryApplicants)



    },
    deleteApplicant: (id) => {
        return db.query(`delete from APPLICANTS where id_applicant = ${id}`)
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
