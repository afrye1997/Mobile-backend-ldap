"use strict"
const express= require('express')
const cors= require('cors')
const app= express();
const PORT=process.env.PORT || 3000;
var connection = require("./Connection.js");
app.use(cors());


app.listen(PORT, () => {
    console.log(`Example app listening at http://localhost:${PORT}`)
  })

app.get('/', (req, res) => {
  res.send('LDAP Test is running')
})

app.get('/checking',  async (req, respond)=>{
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

               });
           }
       });

      
  })

/**
 * 
 *  if (req.filter.matches(obj.attributes))
  res.send(obj);
 */