const Profile = require("../models/profile.model");
const utils = require("../helpers/utils");
const environments = require("../environments/environment");
const { getPagination, getCount, getPaginationData } = require("../helpers/fn");
const User = require("../models/user.model");
const { query } = require("../../config/db.config");
const moment = require("moment");
exports.create = function (req, res) {
  if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
    res.status(400).send({ error: true, message: "Error in application" });
  } else {
    // console.log(req.body);
    const profile = new Profile({ ...req.body });
    Profile.create(profile, async function (err, profile) {
      if (err) return utils.send500(res, err);
      return res.json({
        error: false,
        message: "Data saved successfully",
        data: profile,
      });
    });
  }
};

exports.FindProfileById = async function (req, res) {
  try {
    if (req.params.id) {
      const id = req.params.id;
      console.log(id);
      const profile = await Profile.FindById(id);
      if (!profile) {
        return utils.send500({ error: true, message: "not found" });
      } else {
        return res.json({ data: profile, error: false });
      }
      // Profile.FindById(id, async function   (err, profile) {
      //   if (err) {
      //     console.log(err);
      //   } else {
      //   }
      // });
    }
  } catch (error) {
    return res.json({ data: error, error: true });
  }
};

// exports.FindProfieById = function (req, res) {
//   if (req.params.id) {
//     const id = req.params.id;
//     console.log(id);
//     Profile.FindById(id, async function (err, profile) {
//       if (err) {
//         console.log(err);
//         return utils.send500(res, err);
//       } else {
//         return res.json({ data: profile, error: false });
//       }
//     });
//   }
// };

exports.updateProfile = async function (req, res) {
  if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
    res.status(400).send({ error: true, message: "Error in application" });
  } else {
    const profileId = req.params.id;
    const reqBody = req.body;
    const profile = new Profile({ ...reqBody });
    console.log("profile", req.user.id, req.body.userId);
    if (req.body.userId === req.user.id) {
      // if (req.body.id) {
      //   const updateUserData = {
      //     Username: reqBody?.Username,
      //     FirstName: reqBody?.FirstName,
      //     LastName: reqBody?.LastName,
      //     Address: reqBody?.Address,
      //     Zip: reqBody?.Zip,
      //     City: reqBody?.City,
      //     State: reqBody?.State,
      //     Country: reqBody?.Country,
      //   };

      //   User.update(req.body.userId, updateUserData, (err, result) => {
      //     if (err) return utils.send500(res, err);
      //   });
      // }
      if (req.body.imageUrl) {
        const data = {
          profileId: profileId,
          imageUrl: req.body.imageUrl,
        };
        await Profile.images(data);
      }
      if (req.body?.interests) {
        await User.addInterest(req.body.interests, profileId, []);
      }
      profile.updatedDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
      Profile.update(profileId, profile, async function (err, profile) {
        if (err) return utils.send500(res, err);
        return res.json({
          error: false,
          message: "Profile update successfully",
        });
      });
    } else {
      return res.status(401).json({ message: "Unauthorized access" });
    }
  }
};

const getUsername = async function (username, exisingusername) {
  const query =
    "select Username from users where Username = ? and Username not in (?)";
  const value = [username, exisingusername];
  const user = await utils.executeQuery(query, value);
  return user;
};

exports.getUsersByUsername = async function (req, res) {
  const { searchText } = req.query;
  const profileId = req.user.id;
  const data = await Profile.getUsersByUsername(searchText, profileId);
  return res.send({
    error: false,
    data: data,
  });
};

exports.editNotifications = async function (req, res) {
  const { id } = req.params;
  const { isRead } = req.query;
  Profile.editNotifications(id, isRead, function (err) {
    if (err) return utils.send500(res, err);
    res.json({ error: false, message: "Notification updated successfully" });
  });
};

exports.getNotificationById = async function (req, res) {
  const { id } = req.params;
  const data = await Profile.getNotificationById(id);
  return res.send({
    error: false,
    data: data,
  });
};
exports.getNotification = async function (req, res) {
  const { id } = req.params;
  const data = await Profile.getNotification(id);
  return res.send({
    error: false,
    data: data,
  });
};

exports.getNotificationById = async function (req, res) {
  const { id } = req.params;
  const { page, size } = req.body;
  const { limit, offset } = getPagination(page, size);
  const notificationData = await Profile.getNotificationById(id, limit, offset);

  return res.send(
    getPaginationData(
      { count: notificationData.count, docs: notificationData.data },
      page,
      limit
    )
  );
  // return res.send({
  //   error: false,
  //   data: data,
  // });
};

exports.deleteNotification = function (req, res) {
  Profile.deleteNotification(req.params.id, function (err, result) {
    if (err) return utils.send500(res, err);
    res.json({ error: false, message: "Notification deleted successfully" });
  });
};

exports.groupsAndPosts = async function (req, res) {
  try {
    const groupedPosts = await Profile.groupsAndPosts();

    return res.send(groupedPosts);
  } catch (error) {
    return utils.send500(res, error);
  }
};

exports.getGroups = async function (req, res) {
  try {
    const groups = await Profile.getGroups();
    return res.send(groups);
  } catch (error) {
    return utils.send500(res, error);
  }
};

exports.getGroupBasicDetails = async function (req, res) {
  try {
    const { uniqueLink } = req.params;
    const groupDetails = await Profile.getGroupBasicDetails(uniqueLink);

    return res.send(groupDetails);
  } catch (error) {
    return utils.send500(res, error);
  }
};

exports.getGroupPostById = async function (req, res) {
  try {
    const { id } = req.params;
    const { page, limit } = req.query;
    const offset = page > 0 ? (page - 1) * limit : 0;

    const posts = await Profile.getGroupPostById(id, limit, offset);

    return res.send(posts);
  } catch (error) {
    console.log("error : ", error);
    return utils.send500(res, error);
  }
};

exports.getGroupFileResourcesById = async function (req, res) {
  try {
    const { id } = req.params;
    const posts = await Profile.getGroupFileResourcesById(id);

    return res.send(posts);
  } catch (error) {
    return utils.send500(res, error);
  }
};

exports.getProfiles = async function (req, res) {
  try {
    const { page, limit, gender } = req.query;
    const { id } = req.params;
    const offset = page > 0 ? (page - 1) * limit : 0;
    const profiles = await Profile.getProfiles(limit, offset, id, gender);
    if (profiles.length) {
      return res.send({ error: false, data: profiles });
    } else {
      return res.send({ error: false, data: [] });
    }
  } catch (error) {
    console.log("error : ", error);
    return utils.send500(res, error);
  }
};

exports.getProfilePictures = async function (req, res) {
  try {
    const { page, limit, gender } = req.query;
    const { id } = req.params;
    const offset = page > 0 ? (page - 1) * limit : 0;
    const profilePictures = await Profile.getProfilePictures(
      +limit,
      +offset,
      id,
      gender
    );
    if (profilePictures.length) {
      return res.send({ error: false, data: profilePictures });
    } else {
      return res.send({ error: false, data: [] });
    }
  } catch (error) {
    console.log("error : ", error);
    return utils.send500(res, error);
  }
};

exports.addPictures = async function (req, res) {
  try {
    const data = req.body;
    const id = await Profile.images(data);
    return res.send({ error: false, message: "image uploaded successfully" });
  } catch (error) {
    return utils.send500(res, error);
  }
};

exports.updatePicture = async function (req, res) {
  try {
    const data = req.body;
    const id = req.params.id;
    const img = await Profile.updateImages(data, id);
    return res.send({ error: false, message: "image updated successfully" });
  } catch (error) {
    return utils.send500(res, error);
  }
};
