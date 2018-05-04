const express = require('express')
const path = require('path')
const fb = require('firebase')
const nodemailer = require('nodemailer')
const PORT = process.env.PORT || 5000

// Twilio Credentials
const accountSid = 'AC7d18fe4597d29cf74f4afd2cb962b8a5';
const authToken = 'b600a7f831f829869727dab76510ce98';

//MAIL CREDENTIALS
const gmailEmail = 'zlatan.gs.ta@gmail.com';
const gmailPassword = 'Testpass123!';

const mailTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

let config = {
    apiKey: "AIzaSyBTBg5vGRZ-chcWi3MJTHP4i5XArSqDCtU",
    authDomain: "mojvrt-30377.firebaseapp.com",
    databaseURL: "https://mojvrt-30377.firebaseio.com",
    projectId: "mojvrt-30377",
    storageBucket: "mojvrt-30377.appspot.com",
    messagingSenderId: "517249301794"
};

const firebase = fb.initializeApp(config);
const client = require('twilio')(accountSid, authToken);

function fetchUsers(req, res) {

  let gardens = {};

  const dbParent = firebase.database().ref().child('data');
  dbParent.on('value', function(snapshot) {
    var val = snapshot.val()

    if(val != null) {
      Object.keys(val).forEach(id => {
        gardens[id] =  {
          id: id,
          firstName: val[id].firstName,
          lastName: val[id].lastName,
          phone: val[id].phone,
          address: val[id].address,
          initials: val[id].initials,
          username: val[id].username,
          password: val[id].password,
          paymentDate: val[id].paymentDate,
          sendSMS: val[id].sendSMS,
          sendEmail: val[id].sendEmail
        };
        console.log(val[id].firstName);
      })
    }


    processUsers(req, res, gardens)
    res.send('gotovo')
  })
}

function processUsers(req, res, gardens) {
  let date = req.params.date

  Object.keys(gardens).forEach(id => {
    if(gardens[id].paymentDate === date) {
      if(gardens[id].sendSMS === true) {
        sendSMS(gardens[id].firstName, gardens[id].lastName, gardens[id].phone);
      }
      if(gardens[id].sendEmail === true) {
        sendEmail(gardens[id].firstName, gardens[id].lastName, gardens[id].username);
      }
    }
  })
}

function sendSMS(firstName, lastName, phone) {
  client.messages
  .create({
    to: phone,
    from: '+18572541809',
    body: `Dear ${lastName} ${firstName}, you payment is due today. Yours, Greenstyle Solutions`,
  })
  .then(message => console.log(message.sid));
}

function sendEmail(firstName, lastName, email) {
  console.log(email);
  const mailOptions = {
    from: `Greenstyle Solutions <noreply@firebase.com>`,
    to: email,
  };

  mailOptions.subject = `Payment notification`;
  mailOptions.text = `Dear ${lastName} ${firstName}, you payment is due today. Yours, Greenstyle Solutions`;
  return mailTransport.sendMail(mailOptions).then(() => {
    return console.log('Email sent to:', email);
  });
}

express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .get('/sendNotification/:date', (req, res) => fetchUsers(req, res))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
