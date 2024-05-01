"use strict";
var db = require("../../config/db.config");
const common = require("../common/common");

var Admin = function () {};

Admin.login = function (username, password, result) {
  console.log("User Name = " + username + " and Password :" + password);
  db.query(
    'SELECT * FROM user WHERE user_email = ? AND user_password = ? AND user_type = "Admin" AND user_roles = "1"',
    [username, password],
    async function (err, res) {
      if (err) {
        console.log("error login", err);
        result(err, null);
      } else {
        const admin = res[0];
        console.log(admin);

        if (!admin) {
          result("Invalid Username and Password. Kindly try again !!!!", null);
        } else {
          console.log("Login Data");
          console.log(admin);
          const token = await common.generateJwtToken(res[0]);
          result(null, {
            user_id: admin.user_id,
            user_data: admin,
            accessToken: token,
          });
        }
      }
    }
  );
};

module.exports = Admin;
