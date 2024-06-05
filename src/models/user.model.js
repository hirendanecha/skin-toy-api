"use strict";
const jwt = require("jsonwebtoken");
var db = require("../../config/db.config");
const common = require("../common/common");
const environment = require("../environments/environment");
const { executeQuery } = require("../helpers/utils");

var User = function (user) {
  this.email = user.email;
  this.password = user.password;
  this.isActive = user.isActive || "N";
  this.isAdmin = user.isAdmin || "N";
  this.gender = user.gender;
  this.birthDate = user.birthDate;
};

User.login = function (email, Id, result) {
  db.query(
    `SELECT u.id,
            u.email,
            u.isActive,
            u.createdDate,
            u.isAdmin,
            p.id as profileId,
            p.userName,
            p.country,
            p.zip,
            p.state,
            p.city,
            p.isVaccinated,
            p.isFluShot,
            p.haveChild,
            p.education,
            p.ethnicity,
            p.height,
            p.religion,
            p.isSmoke,
            p.relationshipType,
            p.relationshipHistory,
            p.bodyType,
            p.idealDate,
            p.createdDate,
            p.updatedDate,
            p.profilePicName,
            p.matchIsSmoke,
            p.matchReligion,
            p.matchBodyType,
            p.matchEthnicity,
            p.matchEducation,
            p.matchIsVaccinated,
            p.userStatus,
            p.matchHaveChild
     FROM users as u left join profile as p on p.userId = u.id WHERE u.email = ? AND u.id = ?`,
    [email, Id],
    async function (err, res) {
      if (err) {
        console.log("error login", err);
        return result(err, null);
      } else {
        const user = res[0];
        if (user?.isActive === "N") {
          return result(
            {
              message:
                "Please check your email and click the activation link to activate your account.",
              errorCode: "not_verified",
            },
            null
          );
        }
        if (!user) {
          return result(
            {
              message: "Invalid Email and Password. Kindly try again !!!!",
              errorCode: "bad_credentials",
            },
            null
          );
        } else {
          const token = await common.generateJwtToken(res[0]);
          return result(null, {
            user: user,
            accessToken: token,
          });
        }
      }
    }
  );
};

User.create = function (userData, result) {
  db.query("INSERT INTO users set ?", userData, function (err, res) {
    if (err) {
      console.log("error", err);
      result(err, null);
    } else {
      console.log(res.insertId);
      result(null, res.insertId);
    }
  });
};

User.findAndSearchAll = async (limit, offset, search, startDate, endDate) => {
  let whereCondition = `u.isAdmin = 'N' ${
    search ? `AND p.userName LIKE '%${search}%' OR u.email LIKE '%${search}%'` : ""
  }`;

  if (startDate && endDate) {
    whereCondition += `AND u.createdDate >= '${startDate}' AND u.createdDate <= '${endDate}'`;
  } else if (startDate) {
    whereCondition += `AND u.createdDate >= '${startDate}'`;
  } else if (endDate) {
    whereCondition += `AND u.createdDate <= '${endDate}'`;
  }
  const searchCount = await executeQuery(
    `SELECT count(id) as count FROM users as u WHERE ${whereCondition}`
  );
  const searchData = await executeQuery(
    `SELECT p.id as profileId,
    p.userName,
    p.userId,
    p.city,
    p.state,
    p.zip,
    p.country,
    p.createdDate,
    p.updatedDate,
    p.isVaccinated,
    p.isFluShot,
    p.haveChild,
    p.education,
    p.ethnicity,
    p.height,
    p.religion,
    p.isSmoke,
    p.relationshipType,
    p.relationshipHistory,
    p.bodyType,
    p.idealDate,
    u.email,
    u.gender,
    u.birthDate,
    u.isActive,
    p.profilePicName,
    p.matchIsSmoke,
    p.matchReligion,
    p.matchBodyType,
    p.matchEthnicity,
    p.matchEducation,
    p.matchIsVaccinated,
    p.matchHaveChild
    from profile as p left join users as u on u.id = p.userId WHERE ${whereCondition} order by p.createdDate desc limit ? offset ?`,
    [limit, offset]
  );

  return {
    count: searchCount?.[0]?.count || 0,
    data: searchData,
  };
};

User.findById = async function (user_id) {
  const query = `SELECT u.id,
  u.email,
  u.isActive,
  u.createdDate,
  u.isAdmin,
  u.gender,
  u.birthDate,
  u.isActive,
  p.id as profileId,
  p.*
FROM users as u left join profile as p on p.userId = u.id WHERE u.id = ? `;
  const values = [user_id];
  const user = await executeQuery(query, values);
  return user;
};

User.findByUsernameAndEmail = async function (email) {
  const query = `SELECT * from users WHERE Email = ? or Username = ?`;
  const values = [email, email];
  const user = await executeQuery(query, values);
  console.log(user);
  return user[0];
};

User.findByEmail = async function (email) {
  console.log(email);
  const query = `SELECT u.*,p.userName from users as u left join profile as p on p.userId = u.id WHERE u.email = ?`;
  const values = [email];
  const user = await executeQuery(query, values);
  return user[0];
};

User.findByUsername = async function (username) {
  const query = `SELECT Username from users WHERE Username = ?`;
  const values = [username];
  const user = await executeQuery(query, values);
  return user[0];
};

User.update = function (user_id, user, result) {
  db.query(
    "UPDATE users SET ? WHERE Id=?",
    [user, user_id],
    function (err, res) {
      if (err) {
        console.log("error", err);
        result(err, null);
      } else {
        console.log("update: ", res);
        result(null, res);
      }
    }
  );
};

User.delete = async function (userId, profileId) {
  const query = "delete from comments where profileId = ?";
  const query1 = "delete from posts where profileid = ?";
  const query2 = "delete from communityMembers where profileId = ?";
  const query3 = "delete from community where profileId = ?";
  const query4 = "delete from see_first_profile where profileId = ?";
  const query5 = "delete from unsubscribe_profiles where profileId = ?";
  const query6 = "DELETE FROM users WHERE Id = ?";
  const query7 = "DELETE FROM profile WHERE id = ?";
  const values = [userId];
  const values1 = [profileId];
  await executeQuery(query, values1);
  await executeQuery(query1, values1);
  await executeQuery(query2, values1);
  await executeQuery(query3, values1);
  await executeQuery(query4, values1);
  await executeQuery(query5, values1);
  await executeQuery(query6, values);
  const data = await executeQuery(query7, values1);
  console.log(data);
  // return true;
  // db.query("DELETE FROM users WHERE Id = ?", [user_id], function (err, res) {
  //   if (err) {
  //     console.log("error", err);
  //     result(err, null);
  //   } else {
  //     console.log("user deleted", res);
  //     result(null, res);
  //   }
  // });
};

User.changeAccountType = function (userId, type, result) {
  db.query(
    "UPDATE users SET AccountType = ? WHERE Id=?",
    [type, userId],
    function (err, res) {
      if (err) {
        console.log("error", err);
        result(err, null);
      } else {
        console.log("update: ", res);
        result(null, res);
      }
    }
  );
};

User.adminLogin = function (email, result) {
  db.query(
    `SELECT u.id,
    u.email,
    u.isActive,
    u.createdDate,
    u.isAdmin,
    p.id as profileId,
    p.userName,
    p.country,
    p.zip,
    p.state,
    p.city,
    p.isVaccinated,
    p.isFluShot,
    p.haveChild,
    p.education,
    p.ethnicity,
    p.height,
    p.religion,
    p.isSmoke,
    p.relationshipType,
    p.relationshipHistory,
    p.bodyType,
    p.idealDate,
    p.createdDate,
    p.updatedDate
FROM users as u left join profile as p on p.userId = u.id WHERE u.email = ?`,
    email,
    async function (err, res) {
      if (err) {
        console.log("error login", err);
        return result(err, null);
      } else {
        const user = res[0];
        // console.log(user);

        if (user?.isAdmin === "N") {
          return result(
            {
              message: "Invalid Email and Password. Kindly try again !!!!",
              errorCode: "bad_credentials",
            },
            null
          );
        } else {
          console.log("Login Data");
          console.log(user);
          const token = await common.generateJwtToken(res[0]);
          return result(null, {
            userId: user.id,
            user: user,
            accessToken: token,
          });
        }
      }
    }
  );
};

User.changeStatus = function (userId, status, result) {
  db.query(
    "UPDATE users SET isActive = ? WHERE id= ?",
    [status, userId],
    function (err, res) {
      if (err) {
        console.log("error", err);
        result(err, null);
      } else {
        console.log("update: ", res);
        result(null, res);
      }
    }
  );
};

User.suspendUser = function (userId, status, result) {
  db.query(
    "UPDATE users SET IsSuspended = ? WHERE Id= ?",
    [status, userId],
    function (err, res) {
      if (err) {
        console.log("error", err);
        result(err, null);
      } else {
        console.log("update: ", res);
        result(null, res);
      }
    }
  );
};

User.activateMedia = function (profileId, status, result) {
  db.query(
    "UPDATE profile SET MediaApproved = ? WHERE id= ?",
    [status, profileId],
    function (err, res) {
      if (err) {
        console.log("error", err);
        result(err, null);
      } else {
        console.log("update: ", res);
        result(null, res);
      }
    }
  );
};

User.getAll = async function () {
  const query = `SELECT 
          p.id,
          p.userName
   from users as u left join profile as p on p.userId = u.id where u.isActive='Y' AND u.isAdmin != 'Y' AND p.userName is not NULL order by p.CreatedOn desc limit 500`;
  const values = [];
  const user = await executeQuery(query, values);
  console.log("users===>", user);
  return user;
};

User.getEmail = async function (startDate, endDate) {
  let whereCondition = "";
  if (startDate && endDate) {
    whereCondition += `u.DateCreation >= '${startDate}' AND u.DateCreation <= '${endDate}'`;
  } else if (startDate) {
    whereCondition += `u.DateCreation >= '${startDate}'`;
  } else if (endDate) {
    whereCondition += `u.DateCreation <= '${endDate}'`;
  }
  const query = `select Email from users as u where ${whereCondition} order by u.DateCreation desc`;
  const user = await executeQuery(query);
  console.log("users===>", user);
  return user;
};

User.getInterest = async function () {
  try {
    const query = `select * from interests`;
    const interests = await executeQuery(query);
    return interests;
  } catch (error) {
    return error;
  }
};

User.addInterest = async function (
  interestList,
  profileId,
  removeInterestList
) {
  try {
    if (interestList.length) {
      const newData = interestList
        .map((element) => `(${profileId}, ${element})`)
        .join(", ");
      console.log(newData);
      const query = `select interestId from user_interests where profileId = ${profileId} and interestId in (${interestList}) `;
      const oldData = await executeQuery(query);
      console.log("oldData", oldData);
      if (!oldData.length) {
        const query = `insert into user_interests (profileId,interestId) values ${newData}`;
        const interests = await executeQuery(query);
        return interests;
      }
    }
    if (removeInterestList.length) {
      const query = `delete from user_interests where profileId = ${profileId} and interestId in (${removeInterestList})`;
      const interests = await executeQuery(query);
      return interests;
    }
  } catch (error) {
    return error;
  }
};

// ------------------- Zip Data ------------------

User.getZipData = function (zip, country, result) {
  let query =
    "SELECT country_code, state, city, place, country from zip_us WHERE zip=? ";
  if (country) {
    query = query + "AND country_code = ?";
  }
  query = query + "order by place";
  db.query(query, [zip, country], function (err, res) {
    if (err) {
      console.log("error", err);
      result(err, null);
    } else {
      let response = {};
      var promises = res.map(function (el) {
        response.country_code = el.country_code;
        response.state = el.state;
        response.city = el.city;
        response.places =
          (response.places ? response.places + "," : "") + el.place;
        response.country = el.country;
        return response;
      });

      Promise.all(promises).then(function (items) {
        // items is 2D array
        items = [].concat.apply([], items); // flatten the array
        //do something with the finalized list of items here
        result(null, items);
      });
    }
  });
};

User.getZipCountries = function (result) {
  db.query(
    "select country_code, country from zip_us group by country_code, country order by country asc;",
    function (err, res) {
      if (err) {
        console.log("error", err);
        result(err, null);
      } else {
        result(null, res);
      }
    }
  );
};

User.verification = function (token, result) {
  jwt.verify(token, environment.JWT_SECRET_KEY, async function (err, decoded) {
    if (err) {
      const decodedToken = jwt.decode(token);
      return result(err, decodedToken);
    }
    try {
      console.log("decode user", decoded);
      const updateQuery = await executeQuery(
        "UPDATE users SET isActive ='Y' WHERE id = ?",
        [decoded.user.id]
      );
      const fetchUser = await executeQuery("select * from users where id = ?", [
        decoded.user.id,
      ]);
      console.log("fetchUser", updateQuery, fetchUser);
      return result(null, fetchUser[0]);
    } catch (error) {
      console.log(error);
      return result(err, null);
    }
  });
};

User.resendVerification = async function (email, result) {
  try {
    const findUserByEmail = await executeQuery(
      `select * from users where UserName = ?`,
      [email]
    );
    if (!findUserByEmail?.length) {
      throw "User not found by the given username.";
    }
    return result(null, findUserByEmail[0]);
  } catch (error) {
    return result(error, null);
  }
};

User.setPassword = async function (user_id, password) {
  const query = `UPDATE users SET password=? WHERE id=?`;
  const values = [password, user_id];
  const user = await executeQuery(query, values);
  return user;
};

User.getStats = async function (countryCode) {
  const query =
    "select state,country_code from zip_us where country_code = ? and state != '' group by state";
  const values = [countryCode];
  const stats = await executeQuery(query, values);
  return stats;
};
module.exports = User;
