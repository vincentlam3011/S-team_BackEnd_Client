var redis = require('redis');
// var client = redis.createClient();
// client.on('connect', () => {
//     console.log("Connected");
//     client.setex('123456', 86400, '123456');
//     client.keys('*', (err, res) => {
//         if (err) {
//             console.log(err);
//         } else {
//             console.log(res);
//             // client.FLUSHALL();
//         }
//     })
// })

module.exports = {
    setKey: (value) => {
        var client = redis.createClient();
        client.on('connect', (err) => {
            if (err) {
                console.log('Something went wrong ' + err);
                throw err;
            }
            console.log("REDIS CONNECTED");
            client.setex(value, 86400, value);
            client.keys('*', (err, res) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log(res);
                }
            })
        });
    },
    getKey: (value) => {
        return new Promise((resolve, reject) => {
            var client = redis.createClient();
            client.on('connect', (err) => {
                if (err) {
                    console.log('Something went wrong ' + err);
                    throw err;
                }
                client.get(value, (err, res) => {
                    if (err) {
                        console.log(err);
                        reject(err);
                    }
                    console.log('GET result: ' + res);
                    var isValid = true;
                    if (res !== null) {
                        isValid = false;
                    }
                    resolve(isValid);
                })
            })
        })
    },
}

