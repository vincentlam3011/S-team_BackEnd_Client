var db = require('../utils/db');

module.exports = {
    getAllDisTricts: () => {
        return db.query(`select * from districts;`);
    },
    getAllProvinces: () => {
        return db.query(`select * from provinces;`);
    },
    getDisById: (id) => {
        return db.query(`select * from districts where id_district = ${id}`);
    },
    getByName: (dis, pro) => {
        let getDis = `select * from districts where name = '${dis}'; `;
        let getPro = `select * from provinces where name = '${pro}'; `;
        return db.query(getDis + getPro);
    },
    addArea: (pro, dis, disOnly = true) => {
        if (disOnly) {
            let addDis = `insert into districts (id_province, name) values(${pro.id_province},'${dis.name}')`;
            return db.query(addDis);
        } else {
            let addPro = `insert into provinces (name) values('${pro.name}');`;
            let disCol = `(id_province, name)`;
            let disVal = `, '${dis.name}')`;
            return db.transaction(addPro, disCol, disVal, 'districts');
        }
    }
}
