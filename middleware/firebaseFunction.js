var admin = require("firebase-admin");
var serviceAccount = require('./serviceAccount.json');
const moment = require("moment");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://free2lance-60aff.firebaseio.com"
});
var userModel = require('../models/userModel');
var convertBlobB64 = require('../middleware/convertBlobB64');

const fireStore = admin.firestore();

module.exports = {
    buildDocKey: (email1, email2) => {
        return [email1, email2].sort().join(':')
    },

    createConversation: async (email1, email2) => {
        let docKey = [email1, email2].sort().join(':');
        userModel.getUserImageFromChat(email1, email2).then(data => {
            let arr = [];
            data.forEach(element => {
                element.img = convertBlobB64.convertBlobToB64(element.avatarImg);
                arr.push({ email: element.email, img: element.img, fullname: element.fullname });
            });


            fireStore.collection('chats')
                .doc(docKey)
                .set({
                    messages: [],
                    img: arr,
                    users: [email1, email2],
                    receiverHasRead: false,
                    timestamp: Date.now()
                })
        }, err => {
            console.log('err:', err)
        });


    },
    sendMessage: async (email1, email2) => {
        let docKey = [email1, email2].sort().join(':');
        let msg = "Test Send chat";
        fireStore
            .collection('chats')
            .doc(docKey)
            .update({
                messages: admin.firestore.FieldValue.arrayUnion({
                    sender: email1,
                    message: msg,
                    timestamp: Date.now()
                }),
                receiverHasRead: false
            })
    },
    pushNotificationsFirebase: async (email, content) => {

        console.log('checkExistNotificationsFirebase Work!: ', email)
        const notification =
            await fireStore
                .collection('notifications')
                .doc(email)
                .get();

        if (!notification.exists) {
            const setNotify = await fireStore
                .collection('notifications')
                .doc(email)
                .set({
                    email: email,
                    listNotify: [content],
                    isRead: true
                })
        }
        else {
            console.log('content:', content)
            let arr = admin.firestore.FieldValue.arrayUnion({ content });
            console.log('arr:', arr);

            const setNotify = await fireStore
                .collection('notifications')
                .doc(email)
                .update({
                    listNotify: admin.firestore.FieldValue.arrayUnion({
                        content

                    }),
                    isRead: false
                })
            console.log('setNotify:', setNotify)
        }
        return notification.exists

    }

}
