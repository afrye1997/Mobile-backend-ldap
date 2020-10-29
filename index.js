#!/usr/bin/env nodejs
"use strict";
require("dotenv").config();
const fetch = require("node-fetch");
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const app = express();
app.use(cors());
const bodyParser = require("body-parser");
app.use(bodyParser.json());

var ldap = require("ldapjs");
var client = ldap.createClient({
  url: "ldap://ds.uark.edu",
  reconnect: true,
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`);
});

app.get("/", (req, res) => {
  res.send("LDAP API is running");
});


 //checking here
              /**
               * if( isAccountCreated)
               *  return full object
               * else if isaccount not created
               *  call add new user
               * return wrong credentials
               */




app.post("/login", (req, respond) => {
  //Takes in username and password
  const userUARK = req.body.user;
  const userPW = req.body.password;
  
  //check if username and password are valid
  client.bind(
    `uid= ${userUARK},ou=People,dc=uark,dc=edu`,
    `${userPW}`,
    function (err) {
      if (err) {
        console.log("Incorrect login");
        return respond.status(400).send({
          isError: true,
          result: "Incorrect login",
        });
      } else {
        console.log("Successful Login!");


        var opts = {
          filter: `&(studentclasses=CSCE*)(uid=${userUARK})`,
          scope: "sub",
          attributes: [
            "uid",
            "givenName",
            "mail",
            "studentClasses",
            "displayName",
            "sn",
            "studentDepartments",
          ],
        };

        //base: which location i need to search

        //now will return all info associated with user from LDAP
        client.search("ou=people,dc=uark,dc=edu", opts, (err, res) => {
          if (err) {
            console.log("Error in search " + err);
           
            return res.status(400).send({
              isError: true,
              result: error.message,
            });

          } else {
            res.on("searchEntry", async (entry) => {
              //LDAP object
              const LDAPUSER = entry.object;

              //now let's see if user exists in our db, as in if they have logged on
              fetch(
                `http://mobile-app.ddns.uark.edu/CRUDapis/users/getUser?USER_id=${userUARK}`
              ).then((res) => {
                if (res.status === 400) {
                  //if person doesn't exist, let's add them
                  const {
                    uid,
                    givenName,
                    mail,
                    studentClasses,
                    displayName,
                    sn,
                    studentDepartments,
                  } = LDAPUSER;

                  //if an error is not returned, then we know we need
                  //to add them to the db for the first time
                  axios
                    .post("http://mobile-app.ddns.uark.edu/CRUDapis/users/addUser", {
                      USER_id: `${uid}`,
                      USER_fName: `${givenName}`,
                      USER_LName: `${sn}`,
                      USER_email: `${mail}`,
                    })
                    .then((res) => {
                      console.log(`statusCode: ${res.statusCode}`);
                      console.log(givenName + " is added to DB")
                      // respond.send(true); //returns the ldap
                      respond.status(200).send({
                        isError: false,
                        result: LDAPUSER,
                      });
                    })
                    .catch((error) => {
                      console.error(error);
                      return respond.status(400).send({
                        isError: true,
                        result: error.message,
                      });
                    });
                } else {
                  console.log(userUARK + " was already in DB")
                  return respond.status(400).send({
                    isError: true,
                    result: "Already in db",
                  });
                }
              });
            });

            res.on("searchReference", async (referral) => {
              console.log("referral: " + referral.uris.join());
            });

            res.on("error", async (err) => {
              console.error("error: " + err.message);
              respond.send(err.message);
            });

            res.on("end", async (result) => {
              console.log(result.status);
            });
          }
        });
      }
    }
  );
});


//can be deleted later
app.get("/search", async (req, respond) => {
  client.bind(process.env.LDAP_USERNAME, process.env.LDAP_PASSWORD, function (
    err
  ) {
    if (err) {
      console.log("Error in new connetion " + err);
    } else {
      /*if connection is success then go for any operation*/
      console.log("Successfully connected to LDAP");
      // searchUser();
      const userUARK = req.query.userUARK;
      console.log(userUARK);
      console.log(client.connected);

      var opts = {
        filter: `&(studentclasses=CSCE*)(uid=${userUARK})`,
        scope: "sub",
        //attributes: ["uid", "cn", "mail", "studentClasses", "displayName", "sn", "studentDepartments"],
      };

      //base: which location i need to search

      client.search("ou=people,dc=uark,dc=edu", opts, (err, res) => {
        if (err) {
          console.log("Error in search " + err);
          respond.send("User does not exist");
        } else {
          res.on("searchEntry", async (entry) => {
            respond.send(entry.object);
          });

          res.on("searchReference", async (referral) => {
            console.log("referral: " + referral.uris.join());
          });

          res.on("error", async (err) => {
            console.error("error: " + err.message);
            respond.send(err.message);
          });

          res.on("end", async (result) => {
            console.log(result.status);
          });
        }
      });
    }
  });
});


