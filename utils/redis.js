// var redis = require('redis');
// var client = redis.createClient();
// client.on('connect', () => {
//     console.log("Connected");
//     client.setex('123456', 86400, '123456');
//     client.keys('*', (err, res) => {
//         if (err) {
//             console.log(err);
//         } else {
//             console.log(res);
//         }
//     })
// })

// // export default client;
// module.exports = {
//     setKey: (value) => {
//         var client = redis.createClient();
//         client.on('connect', (err) => {
//             if (err) {
//                 console.log('Something went wrong ' + err);
//                 throw err;
//             }
//             console.log("REDIS CONNECTED");
//             client.setex(value, 864000, value);
//             client.keys('*', (err, res) => {
//                 if (err) {
//                     console.log(err);
//                 } else {
//                     console.log(res);
//                 }
//             })
//         });
//     },
//     getKey: (value) => {
//         return new Promise((resolve, reject) => {
//             var client = redis.createClient();
//             client.on('connect', (err) => {
//                 if (err) {
//                     console.log('Something went wrong ' + err);
//                     throw err;
//                 }
//                 client.get(value, (err, res) => {
//                     if (err) {
//                         console.log(err);
//                         reject(err);
//                     }
//                     console.log('GET result: ' + res);
//                     resolve (res);
//                 })

//             })
//         })
//     },
// }

