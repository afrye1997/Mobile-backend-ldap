"use strict"
const express=require('express')
const cors=require('cors')
const connection= require('./connection.js');
const { nextTick } = require('async');
const app= express();
const PORT=process.env.PORT || 3000;
// const connection= require('./connection')

app.use(cors());


app.listen(PORT, () => {
    console.log(`Example app listening at http://localhost:${PORT}`)
  })

app.get('/', (req, res) => {
  res.send('LDAP Test is running')
})

app.get('/checking',  async (req, respond)=>{
    // const connection= require('./connection')
  //console.log("1", connection.connected)
    const userUARK= req.query.userUARK; 
    console.log(userUARK)
    var opts = {
         filter:(`&(studentclasses=CSCE*)(uid=${userUARK})`),
        //filter:(`&(studentclasses=CSCE*)(uid=af027)`),
           scope: 'sub', 
           attributes: ['uid','cn','mail','studentClasses','displayName']
       };
       
       //base: which location i need to search
       connection.search('ou=people,dc=uark,dc=edu', opts, (err, res) => {
      //  console.log("2", connection.connected)
           if (err) {
               console.log("Error in search " + err)
               respond.send("eek")
           } else {
               res.on('searchEntry', async (entry)=> {
               respond.send(entry.object)
               });
               res.on('searchReference', function (referral) {
                   console.log('referral: ' + referral.uris.join());
               });
   
               res.on('error', function (err) {
                   console.error('error: ' + err.message);
                   respond.send("eek")
               });
               res.on('end', function (result) {
                   console.log(result.status)
               });
              
           }
       });
    
  })

/**
 * 
 *  if (req.filter.matches(obj.attributes))
  res.send(obj);
 */