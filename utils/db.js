var mysql = require('mysql');

var createConnection = () => {
    return mysql.createConnection({
        host: 'localhost',
        port: '3306',
        user: 'root',
        password: '30111998',
        database: 'f2l',
        dateStrings: true,
        timezone: 'Z',

        typeCast: function castField(field, useDefaultTypeCasting) {
            // if ((field.type === "BIT") && (field.length === 1)) {
            //     var bytes = field.buffer();
            //     return (bytes[0] === 1);
            // }
            return (useDefaultTypeCasting());
        }
    })
}

module.exports = {
    query: sql => {
        return new Promise((resolve, reject) => {
            var connection = createConnection();
            connection.connect((err) => {
                if (err) {
                    return console.error('Error: ' + err.message);
                }
                console.log("Database connected");
            });
            connection.query(sql, (error, result, fields) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(result);
                }
                connection.end();
            });
        });
    },
}