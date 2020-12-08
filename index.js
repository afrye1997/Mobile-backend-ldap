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

const crudURL = "http://mobile-app.ddns.uark.edu/CRUDapis";
//const crudURL = "http://localhost:4000";

app.listen(PORT, () => {
  console.log("LDAP API is running");
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
    //TODO: UNCOMMENT THIS
    // `uid= ${userUARK},ou=People,dc=uark,dc=edu`,
    // `${userPW}`,
    process.env.LDAP_USERNAME,
    process.env.LDAP_PASSWORD,
    function (err) {
      if (err) {
        return respond.status(400).send({
          isError: true,
          result: "Incorrect authentication",
        });
      } else {
        console.log("Successful authentication");

        var opts = {
          filter: `&(uid=${userUARK})`,
          scope: "sub",
          attributes: [
            "givenName",
            "uid",
            "cn",
            "mail",
            "studentClasses",
            "facultyClasses",
            "displayName",
            "sn",
            "studentDepartments",
            "objectClass"
          ],
        };

        //base: which location i need to search

        client.search("ou=people,dc=uark,dc=edu", opts, (err, result) => {
          if (err) {
            console.log("Error in search " + err);
            return respond.status(400).send({
              isError: true,
              result: "User does not exist",
            });
          } else {
            result.on("searchEntry", async (entry) => {
              console.log(entry.object)
              const LDAPUSER = entry.object;

              fetch(crudURL + `/users/getUser?USER_id=${userUARK}`).then(
                (result) => {
                  if (result.status === 400) {
                    //if person doesn't exist, let's add them
                    axios
                      .post(crudURL + "/users/addUser", {
                        USER: LDAPUSER,
                      })
                      .then((result) => {
                        return respond.status(200).send({
                          isError: false,
                          result: result.data.result,
                        });
                      })
                      .catch((error) => {
                        console.log("errrrr", error);

                        return respond.status(400).send({
                          isError: true,
                          result: error.message,
                        });
                      });
                  } else {
                    return respond.status(200).send({
                      isError: false,
                      result:
                        LDAPUSER.givenName +
                        " was already in db! But valid credentials!",
                    });
                  }
                }
              );
            });

            result.on("searchReference", async (referral) => {
              console.log("referral: " + referral.uris.join());
            });

            result.on("error", async (err) => {
              console.error("error: " + err.message);
              return respond.status(400).send({
                isError: true,
                result: err.message,
              });
            });

            result.on("end", async (result) => {
              console.log(result.status);
            });
          }
        });
      }
    }
  );
});

app.get("/search", async (req, respond) => {
  client.bind(
    process.env.LDAP_USERNAME,
    process.env.LDAP_PASSWORD,
    function (err) {
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
          //filter: `&(facultydept=CSCE*)(uid=${userUARK})`,
          filter: `&(uid=${userUARK})`,
          scope: "sub",
          attributes: [
            "uid",
            "cn",
            "mail",
            "studentClasses",
            "facultyClasses",
            "displayName",
            "sn",
            "studentDepartments",
            "objectClass"
          ],
        };
//uoaFaculty
//uoaStudent
//uoaStaff

        //base: which location i need to search

        client.search("ou=people,dc=uark,dc=edu", opts, (err, res) => {
          if (err) {
            console.log("Error in search " + err);
            respond.send("User does not exist");
          } else {
            res.on("searchEntry", async (entry) => {
              console.log("entered");
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
    }
  );
});

// app.get("/classes", async (req, respond) => {
//   client.bind(process.env.LDAP_USERNAME, process.env.LDAP_PASSWORD, function (
//     err
//   ) {
//     if (err) {
//       console.log("Error in new connetion " + err);
//     } else {
//       /*if connection is success then go for any operation*/
//       console.log("Successfully connected to LDAP");
//       const classSearch = req.body.classSearch;

//       var opts = {
//         filter: `&(studentclasses=${classSearch}*)`,
//         scope: "sub",
//         timeLimit: 6000,
//         //attributes: ["uid", "cn", "mail", "studentClasses", "displayName", "sn", "studentDepartments"],
//       };

//       //base: which location i need to search

//       client.search("ou=people,dc=uark,dc=edu", opts, (err, res) => {
//         if (err) {
//           console.log("Error in search " + err);
//           respond.send("User does not exist");
//         } else {
//           var students = [];
//           res.on("searchEntry", async (entry) => {
//             students.push(entry.object.uid);
//           });

//           res.on("searchReference", async (referral) => {
//             console.log("referral: " + referral.uris.join());
//           });

//           res.on("error", async (err) => {
//             console.error("error: " + err.message);
//             respond.send(err.message);
//           });

//           res.on("end", async (result) => {
//             console.log(result.status);
//             respond.send(students);
//             students = [];
//           });
//         }
//       });
//     }
//   });
// });
