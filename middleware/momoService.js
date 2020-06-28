
const https = require('https');
var  uuid = require( 'uuid-random');

//parameters send to MoMo get get payUrl
var endpoint = "https://test-payment.momo.vn/gw_payment/transactionProcessor"
var hostname = "https://test-payment.momo.vn"
var path = "/gw_payment/transactionProcessor"
var partnerCode = "MOMODJRT20200622"
var accessKey = "ACLD9DInAVL0TmsZ"
var serectkey = "64skdzYiuS1v08vQtQS1FFxIBrtRvLUd"
var notifyurl = "https://f2l-client.herokuapp.com/handleIPNMoMo"

// var orderId = uuidv1.v1()
// var requestId = uuidv1.v1()

var requestType = "captureMoMoWallet"
var extraData = "merchantName=PaymentF2L";
// var returnUrl = `https://test-payment.momo.vn/gw_payment/qr?&partnerCode=${partnerCode}&accessKey=${accessKey}
// &requestId=${requestId}&amount=${amount}&orderId=${orderId}
// &requestType=${requestType}&signature=${signature}`
var returnUrl = "https://f2l-client.herokuapp.com/handleMoMoIPN";
//pass empty value if your merchant does not have stores else merchantName=[storeName]; merchantId=[storeId] to identify a transaction map with a physical store
//before sign HMAC SHA256 with format
//partnerCode=$partnerCode&accessKey=$accessKey&requestId=$requestId&amount=$amount&orderId=$oderId&orderInfo=$orderInfo&returnUrl=$returnUrl&notifyUrl=$notifyUrl&extraData=$extraData
//json object send to MoMo endpoint


createSignature = (data) => {
    var rawSignature =
        "partnerCode=" + partnerCode +
        "&accessKey=" + accessKey +
        "&requestId=" + data.requestId +
        "&amount=" + data.amount +
        "&orderId=" + data.orderId +
        "&orderInfo=" + data.orderInfo +
        "&returnUrl=" + returnUrl +
        "&notifyUrl=" + notifyurl +
        "&extraData=" + extraData
    //puts raw signature
    console.log("--------------------RAW SIGNATURE----------------")
    console.log(rawSignature)

    //signature
    const crypto = require('crypto');
    return crypto.createHmac('SHA256', serectkey)
        .update(rawSignature)
        .digest('hex');
},

module.exports = {
    createSignature: (data) => {
        var rawSignature =
            "partnerCode=" + partnerCode +
            "&accessKey=" + accessKey +
            "&requestId=" + data.requestId +
            "&amount=" + data.amount.toString() +
            "&orderId=" + data.orderId +
            "&orderInfo=" + data.orderInfo +
            "&returnUrl=" + returnUrl +
            "&notifyUrl=" + notifyurl +
            "&extraData=" + extraData
        //puts raw signature
        console.log("--------------------RAW SIGNATURE----------------")
        console.log(rawSignature)

        //signature
        const crypto = require('crypto');
        return crypto.createHmac('SHA256', serectkey)
            .update(rawSignature)
            .digest('hex');
    },
    transferMoneyMomoToF2L: async (data) => {
        // Send the request and get the response
        data.orderId = `${data.id_applicant}-F2L` + Date.now();
        // console.log('orderId:', orderId)
        data.requestId = uuid();
        // console.log('requestId:', requestId);
        data.orderInfo = `${data.id_applicant} pay with F2L`;
        var signature = createSignature(data);
  
        var body = JSON.stringify({
            partnerCode: partnerCode,
            accessKey: accessKey,
            requestId: data.requestId,
            amount: data.amount.toString(),
            orderId: data.orderId,
            orderInfo: data.orderInfo,
            returnUrl: returnUrl,
            notifyUrl: notifyurl,
            extraData: extraData,
            requestType: requestType,
            signature: signature,
            // bankCode: 'VCB'
        })
        //Create the HTTPS objects
        var options = {
            hostname: 'test-payment.momo.vn',
            port: 443,
            path: '/gw_payment/transactionProcessor',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        };
        console.log("Sending....")
        return {options,body};
        var req = await https.request(options, (res) => {
            console.log(`Status: ${res.statusCode}`);
            console.log(`Headers: ${JSON.stringify(res.headers)}`);
            res.setEncoding('utf8');
            res.on('data', (body) => {
                console.log('Body');
                console.log(body);
                console.log('payURL');
                console.log(JSON.parse(body).payUrl);
                return JSON.parse(body).payUrl

            });
            res.on('end', () => {
                console.log('No more data in response.');
            });
        });

        req.on('error', (e) => {
            console.log(`problem with request: ${e.message}`);
        });

        // write data to request body
        req.write(body);
        req.end();
        // return req;
        // router.get('/', function (req, res, next) {
        //     req = https.request(options, (res) => {
        //         console.log(`Status: ${res.statusCode}`);
        //         console.log(`Headers: ${JSON.stringify(res.headers)}`);
        //         res.setEncoding('utf8');
        //         res.on('data', (body) => {
        //             console.log('Body');
        //             console.log(body);
        //             console.log('payURL');
        //             console.log(JSON.parse(body).payUrl);
        //             return JSON.parse(body).payUrl

        //         });
        //         res.on('end', () => {
        //             console.log('No more data in response.');
        //             return '';
        //         });
        //     });

        //     req.on('error', (e) => {
        //         console.log(`problem with request: ${e.message}`);
        //         return '';

        //     });

        //     // write data to request body
        //     req.write(body);
        //     res.json(body);
        //     req.end();
        // });
    },


}
