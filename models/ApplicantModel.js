var db = require('../utils/db');
var convertBlobB64 = require('../middleware/convertBlobB64');

module.exports = {

    getApplicantsByJobId: (id, id_status) => {
        let sqlQueryApplicants = `select u.id_user, u.fullname, u.email, u.dial, a.id_applicant, a.proposed_price, a.attachment, a.introduction_string from users as u, applicants as a, jobs as j
        where j.id_job = a.id_job and a.id_user = u.id_user and j.id_job = ${id} and a.id_status=${id_status} order by a.proposed_price asc;`
        return db.query(sqlQueryApplicants);
    },
    getApplicantsByUserId: (id) => {
        let sqlQueryApplicants = `SELECT A.*,U.fullname,U.email FROM applicants AS A, users AS U WHERE A.id_user = U.id_user and A.id_user= ${id}`;
        return db.query(sqlQueryApplicants);
    },
    getApplicantsByUserIdJobId: (id_user, id_job) => {
        let sqlQueryApplicants = `SELECT * FROM applicants WHERE id_user = ${id_user} and id_job = ${id_job}`;
        return db.query(sqlQueryApplicants);
    },
    getApplicantsByApplicantId: (id_applicant) => {
        let sqlQueryApplicants = `SELECT * FROM applicants WHERE id_applicant=${id_applicant}`;
        return db.query(sqlQueryApplicants);
    },
    addApplicant: (applicants) => {
        // if (applicants.attachment !== null && applicants.attachment !== '') {
        applicants.attachment = convertBlobB64.convertB64ToBlob(applicants.attachment).toString('hex');
        // }
        let columsJob = `(id_user,id_job,proposed_price,attachment, introduction_string)`
        let valueJob = `('${applicants.id_user}',
        '${applicants.id_job}','${applicants.proposed_price}',
        x'${applicants.attachment}', '${applicants.introduction_string}')`;
        let sqlQueryApplicants = `insert into applicants` + columsJob + ` values` + valueJob + `;`;
        return db.query(sqlQueryApplicants)
    },
    updateNewPrice: (applicants) => {
        applicants.attachment = convertBlobB64.convertB64ToBlob(applicants.attachment).toString('hex');

        let sqlQueryApplicants = `update applicants SET proposed_price =${applicants.proposed_price}, attachment=x'${applicants.attachment}'
        WHERE id_user = ${applicants.id_user} and id_job = ${applicants.id_job};`;
        return db.query(sqlQueryApplicants)
    },
    editApplicant: (applicants) => {
        applicants.attachment = convertBlobB64.convertB64ToBlob(applicants.attachment).toString('hex');

        let sqlQueryApplicants = `update applicants SET proposed_price ='${applicants.proposed_price}',attachment=x'${applicants.attachment}', introduction_string = '${applicants.introduction_string}'
        WHERE id_applicant = '${applicants.id_applicant}';`;
        return db.query(sqlQueryApplicants)
    },
    deleteApplicant: (id) => {
        return db.query(`delete from applicants where id_applicant = ${id}`)
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
