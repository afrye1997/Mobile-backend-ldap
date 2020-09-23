// af027@turing:~/ldap$ cat example.ls
// ldapsearch -vx -b 'ou=people,dc=uark,dc=edu' -D 'uid=ds-csce,ou=people,dc=uark,dc=edu' -y /home/af027/ldap/ld.sec '(studentclasses=CSCE*)' ldaps://ds.uark.edu uid cn

// the binduser we use for ldap is ds-csce
// you may have to use the entire 'uid=ds-csce,ou=people,dc=uark,dc=edu', depending on how you're contacting the ldap server

// incidentally, the university's ldap server can be reached at ldaps://ds.uark.edu

require('dotenv').config()
var ldap = require('ldapjs');
var client = ldap.createClient({
  url: 'ldap://ds.uark.edu',
  reconnect: true
});

/*use this to create connection*/
function authenticateDN(username, password) {

    /*bind use for authentication*/
    client.bind(username, password, function (err) {
        if (err) {
            console.log("Error in new connetion " + err)
        } else {
            /*if connection is success then go for any operation*/
            console.log("Success");
            // searchUser();
        }
    });
}

authenticateDN("uid=ds-csce,ou=people,dc=uark,dc=edu", "B33z1t_p0w")
//authenticateDN(process.env.LDAP_USERNAME, process.env.LDAP_PASSWORD)
module.exports = client;



 


