"use strict";

const User = require("../models/user.model");
const Profile = require("../models/profile.model");
const utils = require("../helpers/utils");
const environments = require("../environments/environment");
const jwt = require("jsonwebtoken");
const authorize = require("../middleware/authorize");
const { getPagination, getCount, getPaginationData } = require("../helpers/fn");
const { Encrypt } = require("../helpers/cryptography");
const common = require("../common/common");

exports.login = async function (req, res) {
  console.log("jkfhguysdhfgbdf");
  const { email, password } = req.body;
  const user = await User.findByEmail(email);
  console.log(user);
  if (user) {
    const encryptedPassword = Encrypt(password);
    const isMatch = encryptedPassword === user.password;
    console.log(isMatch);
    if (isMatch) {
      User.login(email, user.id, function (err, token) {
        if (err) {
          console.log(err);
          if (err?.errorCode) {
            return res.status(400).send({
              error: true,
              message: err?.message,
              errorCode: err?.errorCode,
            });
          }
          return res.status(400).send({ error: true, message: err });
        } else {
          res.cookie("auth-user", token, {
            // expire: new Date(Date.now() + 900000),
            secure: true,
            sameSite: "none",
            domain: environments.domain,
          });
          return res.json(token);
        }
      });
    } else {
      return res.status(400).send({
        error: true,
        message: "Password is incorrect!",
      });
    }
  } else {
    return res.status(400).send({
      error: true,
      message: "Invalid Email and Password. Kindly try again!",
    });
  }
};
exports.getToken = async function (req, res) {
  const data = req?.cookies;
  console.log(data["auth-user"]);
  if (data) {
    const token = data["auth-user"];

    if (token) {
      return res.json(token);
    } else {
      return res.status(400).json({ message: "" });
    }
  } else {
    return res.status(400).json({ message: "" });
  }
};

exports.create = async function (req, res) {
  console.log(req.body);
  if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
    res.status(400).send({ error: true, message: "Error in application" });
  } else {
    const user = new User({ ...req.body });
    const oldUser = await User.findByEmail(user.email);
    if (!oldUser) {
      const encryptedPassword = Encrypt(user.password);
      user.password = encryptedPassword;
      User.create(user, async function (err, userId) {
        if (err) return utils.send500(res, err);
        user["id"] = userId;
        user["userName"] = req.body?.userName;
        await utils.registrationMail(user);
        const data = {
          userId: user.id,
          userName: req.body.userName,
        };
        Profile.create(data, async function (err, profileId) {
          if (err) return utils.send500(res, err);
          data["profileId"] = profileId;
          console.log(data);
          return res.json({
            error: false,
            message: "Data saved successfully",
            data: data,
          });
        });
      });
    } else {
      return res.status(400).send({
        error: true,
        message: "Email already exists, please enter a different email",
      });
    }
  }
};

exports.findAll = async (req, res) => {
  const { page, size, search, startDate, endDate } = req.body;
  const { limit, offset } = getPagination(page, size);
  const searchCountData = await User.findAndSearchAll(
    limit,
    offset,
    search,
    startDate,
    endDate
  );
  return res.send(
    getPaginationData(
      { count: searchCountData.count, docs: searchCountData.data },
      page,
      limit
    )
  );
};

exports.getAll = async function (req, res) {
  // User.getAll(function (err, users) {
  //   if (err) return utils.send500(res, err);
  //   res.send(users);
  // });
  const Users = await User.getAll();
  res.send({
    error: false,
    data: Users,
  });
};

exports.getEmail = async function (req, res) {
  const { startDate, endDate } = req.body;
  const Users = await User.getEmail(startDate, endDate);
  res.send({
    error: false,
    data: Users,
  });
};

exports.getInterest = async function (req, res) {
  try {
    const interests = await User.getInterest();
    return res.send({ error: false, data: interests });
  } catch (error) {
    return res
      .status(500)
      .send({ error: true, message: "something went wrong!!" });
  }
};

exports.addInterest = async function (req, res) {
  try {
    const { interestsList, profileId, removeInterestList } = req.body;
    const interests = await User.addInterest(
      interestsList,
      profileId,
      removeInterestList
    );
    return res.send({ error: false, data: interests });
  } catch (error) {
    return res
      .status(500)
      .send({ error: true, message: "something went wrong!!" });
  }
};

exports.getUserList = function (req, res) {
  User.getUserList(req.params.id, function (err, user) {
    if (err) return utils.send500(res, err);
    res.send(user);
  });
};

exports.findById = async function (req, res) {
  const user = await User.findById(req.params.id);
  if (user) {
    res.send(user);
  } else {
    res.status(400).send({
      error: true,
      message: "User not found",
    });
  }
  // , function (err, user) {
  //   if (err) return utils.send500(res, err);
  //   res.send(user);
  // });
};

exports.update = function (req, res) {
  if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
    res.status(400).send({ error: true, message: "Error in application" });
  } else {
    const userToUpdate = new User(req.body);
    // console.log(req.params.id, userToUpdate);
    User.update(req.params.id, userToUpdate, function (err, result) {
      if (err) return utils.send500(res, err);
      res.json({
        error: false,
        message: "User update successfully",
      });
    });
  }
};

exports.setPassword = async function (req, res) {
  if (Object.keys(req.body).length === 0) {
    res.status(400).send({ error: true, message: "Error in application" });
  } else {
    const token = req.body.token;
    const newPassword = req.body.password;
    const decoded = jwt.verify(token, environments.JWT_SECRET_KEY);
    if (decoded) {
      const user = await User.findById(decoded.user.id, res);
      console.log("user=>", user);
      if (user) {
        const encryptedPassword = Encrypt(newPassword);
        // const encryptedPassword = await bcrypt.hash(newPassword, 10);
        User.setPassword(decoded.user.id, encryptedPassword);
        res.json({ error: false, message: "success" });
      }
    } else {
      return res.status(401).json({ message: "Unauthorized token" });
    }
  }
};

exports.forgotPassword = async function (req, res) {
  if (Object.keys(req.body).length === 0) {
    res.status(400).send({ error: true, message: "Error in application" });
  } else {
    const email = req.body.email;
    const user = await User.findByEmail(email);
    if (user) {
      const data = await utils.forgotPasswordMail(user);
      if (data.messageId) {
        return res.json({
          error: false,
          message: "please check your mail for reset password",
        });
      } else {
        return res.json({ error: true, message: data.error });
      }
    } else {
      return res.status(404).json({
        error: true,
        message: "please check your mail for reset password",
      });
    }
  }
};

exports.changeActiveStatus = function (req, res) {
  console.log(req.params.id, req.query.isActive);
  User.changeStatus(req.params.id, req.query.isActive, function (err, result) {
    if (err) {
      return utils.send500(res, err);
    } else {
      res.json({ error: false, message: "User status changed successfully" });
    }
  });
};
exports.userSuspend = function (req, res) {
  console.log(req.params.id, req.query.IsSuspended);
  User.suspendUser(
    req.params.id,
    req.query.IsSuspended,
    function (err, result) {
      if (err) {
        return utils.send500(res, err);
      } else {
        res.json({
          error: false,
          message:
            req.query.IsSuspended === "Y"
              ? "User suspend successfully"
              : "User unsuspend successfully",
        });
      }
    }
  );
};

exports.activateMedia = function (req, res) {
  console.log(req.params.id, req.query.IsSuspended);
  User.activateMedia(
    req.params.id,
    req.query.MediaApproved,
    function (err, result) {
      if (err) {
        return utils.send500(res, err);
      } else {
        res.json({
          error: false,
          message:
            req.query.MediaApproved === 0
              ? "Activate media successfully"
              : "De-activate media successfully",
        });
      }
    }
  );
};

exports.delete = function (req, res) {
  const userId = req.params.id;
  const profileId = req.query.profileId;
  console.log(userId, profileId);
  if (req.query.profileId === req.user.id) {
    const isDeleted = User.delete(userId, profileId);
    if (isDeleted) {
      res.json({ error: false, message: "User deleted successfully" });
    }
  } else {
    return res.status(401).json({ message: "Unauthorized token" });
  }
};

exports.adminLogin = async function (req, res) {
  console.log("jkfhguysdhfgbdf");
  const { email, password } = req.body;
  const user = await User.findByEmail(email);
  console.log(user);
  if (user) {
    const encryptedPassword = Encrypt(password);
    const isMatch = encryptedPassword === user.Password;
    console.log(isMatch);
    if (isMatch) {
      User.adminLogin(email, function (err, token) {
        if (err) {
          console.log(err);
          if (err?.errorCode) {
            return res.status(400).send({
              error: true,
              message: err?.message,
              errorCode: err?.errorCode,
            });
          }
          return res.status(400).send({ error: true, message: err });
        } else {
          return res.json(token);
        }
      });
    } else {
      return res
        .status(400)
        .send({ error: true, message: "Password is incorrect" });
    }
  } else {
    return res.status(400).send({ error: true, message: "User not found" });
  }
};

exports.changeAccountType = function (req, res) {
  if (req.params.id) {
    const userId = req.params.id;
    User.changeAccountType(userId, req.query.type, function (err, result) {
      if (err) {
        return utils.send500(res, err);
      } else {
        res.send({
          error: false,
          message: "Account type change successfully",
        });
      }
    });
  } else {
    res.status(400).send({ error: true, message: "Error in application" });
  }
};

// ------------------- Zip Data ------------------

exports.getZipData = function (req, res) {
  User.getZipData(req.params.zip, req.query.country, function (err, data) {
    if (err) return utils.send500(res, err);
    if (data.length) {
      res.send(data);
    } else {
      res.send({
        error: true,
        message:
          "If Your postal code is not found in our database, Please enter a postal code nearest to you.",
      });
    }
  });
};

exports.getZipCountries = function (req, res) {
  User.getZipCountries(function (err, data) {
    if (err) return utils.send500(res, err);
    res.send(data);
  });
};

exports.verification = function (req, res) {
  User.verification(req.params.token, async function (err, data) {
    if (err) {
      if (err?.name === "TokenExpiredError" && data?.userId) {
        return res.redirect(
          `${
            environments.FRONTEND_URL
          }/user/verification-expired?user=${encodeURIComponent(data.email)}`
        );
      }
      return utils.send500(res, err);
    }
    // console.log(data);
    // if (data.isAdmin === "Y") {
    //   return res.redirect(`${environments.ADMIN_URL}/auth/partner-login`);
    // }
    console.log(data);
    const token = await common.generateJwtToken(data);
    console.log(token);
    return res.redirect(
      `${environments.FRONTEND_URL}/on-boarding?token=${token}`
    );
  });
};

exports.resendVerification = function (req, res) {
  if (Object.keys(req.body).length === 0 || !req.body?.email?.trim()) {
    return res
      .status(400)
      .send({ error: true, message: "No valid email is given." });
  }
  User.resendVerification(req.body?.email?.trim(), async function (err, data) {
    if (err) return utils.send500(res, err);
    if (data.isAdmin === "Y") {
      await utils.partnerRegistrationMail({ ...data }, data?.user_id);
    } else {
      await utils.registrationMail({ ...data }, data?.user_id);
    }
    return res.json({
      error: false,
      message: "Verification mail sent successfully.",
    });
  });
};

exports.logout = function (req, res) {
  console.log("cookies");
  const token = req.headers.authorization.split(" ")[1];
  authorize.setTokenInList(token);
  res.clearCookie("auth-user", {
    sameSite: "none",
    secure: true,
    domain: environments.domain,
  });
  // res.cookie("auth-user", 'Hello', {
  //   expire: new Date(Date.now() - 900000),
  //   secure: true,
  //   sameSite: "none",
  //   domain: environments.domain,
  // });
  return res.status(200).json({ message: "logout successfully" });
};

exports.getStats = async function (req, res) {
  console.log("innn");
  const countryCode = req?.query?.countryCode;
  if (countryCode) {
    const states = await User.getStats(countryCode);
    if (states) {
      res.json(states);
    } else {
      res.status(404).send({ message: "not found" });
    }
  }
};

exports.verifyToken = async function (req, res) {
  try {
    const token = req.params.token;
    const decoded = jwt.verify(token, environments.JWT_SECRET_KEY);
    if (decoded.user) {
      res.status(200).send({ message: "Authorized User", verifiedToken: true });
    } else {
      res
        .status(401)
        .json({ message: "Unauthorized Token", verifiedToken: false });
    }
  } catch (err) {
    res.status(401).json({ message: "Invalid token", verifiedToken: false });
  }
};
