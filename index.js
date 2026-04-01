const express = require('express');
const ejs = require('ejs');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');





const app = express();
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname , '/public')));
app.use(bodyParser.urlencoded({ extended: false }))


var uri = "mongodb://hlayal003:h123123@ac-8m6ld0q-shard-00-00.xwl7gtf.mongodb.net:27017,ac-8m6ld0q-shard-00-01.xwl7gtf.mongodb.net:27017,ac-8m6ld0q-shard-00-02.xwl7gtf.mongodb.net:27017/db?ssl=true&replicaSet=atlas-wznc0s-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(uri)
.then(function(){console.log("conectted")}).catch(()=>{
    console.log("false");
});

//email 
const transporter = nodemailer.createTransport({
    service: 'gmail', // or "smtp.example.com" for custom SMTP
    auth: {
      user: 'altaweel@thrillagency.net',
      pass: 'yzli hqzf pspy ykuo',
    },
  });

const schema = new mongoose.Schema({date: String, name: String, mobile : String  , city : String , c1 : String , c2: String  });

const Form = mongoose.model('form',schema, ); 


var port = process.env.PORT || 3000;
app.listen(port,function(){
    console.log('server started');
});

app.get('/',function(req,res){

   const subdomain = req.subdomains[0];
//    console.log(subdomain);
    if(subdomain === "test"){
        res.render("index");


    }else{
        res.render("index");
    }

    // res.render("index");
    
    });



    app.get('/admin', async function(req,res){
        const data = await Form.find();
        console.log(data);

        res.render("admin" , {'data' : data});

    })


    app.get('/login', async function(req,res){
        const data = await Form.find();
        console.log(data);

        res.render("signin");

    })


    app.post('/', async function(req,res){

        let name  = req.body.name; 
        let  mobile  = req.body.mobile;
        let  city  = req.body.city;
        let  c1  = "uncheck";
        let  c2  = "uncheck";

       if(req.body.c1 === "c1"){
        
        c1  = "check";

       }

       if(req.body.c2 === "c2"){
       
        c2  = "check";
       }


       // add to DB 

       const  date = new Date();
       console.log(date.toLocaleString());

     const f1 = new Form({
        'date' : date.toLocaleString(),
        'name' : name,
        'mobile' : mobile,
        'city' : city,
        'c1' : c1,
        'c2' : c2

     });

     f1.save();


     const mailOptions = {
        from: 'altaweel@thrillagency.net',
        to:'growth@dinarholding.com',
        subject: 'new Register',
        text:' '+name+'\n'+mobile+'\n'+city+'\n'+name+'\n'+' المشاركة في نمو العلامة التجارية'+c1+'\n'+'الحصول على حق العلامة التجارية'+c2 ,
      };
      try {
        await transporter.sendMail(mailOptions);
        // res.status(200).send('Email sent successfully!');
      } catch (err) {
        console.error(err);
        // res.status(500).send('Failed to send email.');
      }


 res.render("submit");

    })