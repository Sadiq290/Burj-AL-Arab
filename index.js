const express = require('express')
const app = express()
const port = 3001
const admin = require("firebase-admin");
require('dotenv').config()
// console.log(process.env.DB_PASS)
const bodyParser = require('body-parser')
const cors = require('cors')
app.use(cors())
app.use(bodyParser.json())

const serviceAccount = require("./configs/burj-al-arab-10-firebase-adminsdk-3resf-45f543e5e0.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.DB_FIRE
});

app.get('/', (req, res) => {
   res.send('Hello')
})

const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.u16ta.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const bookings = client.db(`${process.env.DB_NAME}`).collection("Booking");
    app.post('/addBooking', (req, res) => {
        const newBooking = req.body
        bookings.insertOne(newBooking)
            .then(res => console.log(res))
    })
    app.get('/bookings', (req, res) => {
        const bearer = req.headers.authorization
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            console.log({ idToken })
            admin
                .auth()
                .verifyIdToken(idToken)
                .then((decodedToken) => {
                    const decodedEmail = decodedToken.email;
                    if (decodedEmail === req.query.email) {
                        bookings.find({ email: req.query.email })
                            .toArray((err, documents) => {
                                res.status(200).send(documents)
                            })
                    }
                })
                .catch((error) => {
                    res.status(401).send('Unauthorized Access')
                });
        }
        else {
            res.status(401).send('Unauthorized Access')
        }

    })

});

app.listen(process.env.PORT || port)