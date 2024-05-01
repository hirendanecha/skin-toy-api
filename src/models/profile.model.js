"use strict";
var db = require("../../config/db.config");
const common = require("../common/common");
const environment = require("../environments/environment");
const { executeQuery } = require("../helpers/utils");

var Profile = function (profile) {
  this.userId = profile.userId;
  this.userName = profile.userName;
  this.country = profile.country;
  this.zip = profile.zip;
  this.state = profile.state;
  this.city = profile.city;
  this.isVaccinated = profile.isVaccinated;
  this.isFluShot = profile.isFluShot;
  this.haveChild = profile.haveChild;
  this.education = profile.education;
  this.ethnicity = profile.ethnicity;
  this.height = profile.height;
  this.religion = profile.religion;
  this.isSmoke = profile.isSmoke;
  this.relationshipType = profile.relationshipType;
  this.relationshipHistory = profile.relationshipHistory;
  this.bodyType = profile.bodyType;
  this.idealDate = profile.idealDate;
  this.createdDate = profile.createdDate;
  this.updatedDate = profile.updatedDate;
};

Profile.create = function (profileData, result) {
  db.query("INSERT INTO profile set ?", profileData, function (err, res) {
    if (err) {
      console.log("error", err);
      result(err, null);
    } else {
      console.log(res.insertId);
      result(null, res.insertId);
    }
  });
};

Profile.FindById = async function (profileId) {
  const query = `SELECT p.id as profileId,
    p.userName,
    p.userId,
    u.email,
    u.gender,
    u.birthDate,
    u.isActive,
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
    p.idealDate
  FROM profile as p left join users as u on u.id = p.userId WHERE p.id=?`;
  const values = profileId;
  const [profile] = await executeQuery(query, values);
  const query1 = "select imageUrl,id from profilePictures where profileId = ?;";
  const value1 = [profile.profileId];
  const query2 =
    "select ui.interestId,i.name from user_interests as ui left join interests as i on i.id = ui.interestId  where ui.profileId = ?;";
  const value2 = [profile.profileId];
  const profilePictures = await executeQuery(query1, value1);
  const interestList = await executeQuery(query2, value2);
  profile["profilePictures"] = profilePictures;
  profile["interestList"] = interestList;
  return profile;
};

Profile.update = function (profileId, profileData, result) {
  db.query(
    "UPDATE profile SET ? WHERE id=?",
    [profileData, profileId],
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

Profile.getUsersByUsername = async function (searchText) {
  if (searchText) {
    const query = `select p.ID as Id, p.Username,p.ProfilePicName from profile as p left join users as u on u.Id = p.UserID WHERE u.IsAdmin='N' AND u.IsSuspended='N' AND p.Username LIKE ? order by p.Username limit 500`;
    const values = [`${searchText}%`];
    const searchData = await executeQuery(query, values);
    return searchData;
  } else {
    return { error: "data not found" };
  }
};

Profile.getNotificationById = async function (id) {
  if (id) {
    const query = `select n.*,p.Username,p.FirstName,p.ProfilePicName from notifications as n left join profile as p on p.ID = n.notificationByProfileId where n.notificationToProfileId =? order by createDate desc`;
    const values = [id];
    const notificationData = await executeQuery(query, values);
    return notificationData;
  } else {
    return { error: "data not found" };
  }
};

Profile.getNotification = async function (id) {
  if (id) {
    const query = "select * from notifications where id = ?";
    const values = [id];
    const notificationData = await executeQuery(query, values);
    return notificationData;
  } else {
    return { error: "data not found" };
  }
};

Profile.editNotifications = function (id, isRead, result) {
  db.query(
    "update notifications set isRead=? WHERE id = ?",
    [isRead, id],
    function (err, res) {
      if (err) {
        console.log("error", err);
        result(err, null);
      } else {
        console.log("notification updated", res);
        result(null, res);
      }
    }
  );
};

Profile.deleteNotification = function (user_id, result) {
  db.query(
    "DELETE FROM notifications WHERE Id = ?",
    [user_id],
    function (err, res) {
      if (err) {
        console.log("error", err);
        result(err, null);
      } else {
        console.log("notification deleted", res);
        result(null, res);
      }
    }
  );
};

Profile.groupsAndPosts = async () => {
  const groupsResult = await executeQuery(
    'SELECT * FROM profile WHERE AccountType = "G" AND IsDeleted = "N" AND IsActivated = "Y" ORDER BY FirstName'
  );

  const groupIds = groupsResult.map((group) => group.ID);

  const postsResult = await executeQuery(
    'SELECT * FROM posts WHERE isdeleted = "N" AND posttoprofileid IS NOT NULL AND posttype NOT IN ("CHAT", "TA") AND posttoprofileid IN (?) ORDER BY ID DESC',
    [groupIds]
  );

  const allGroupWithPosts = postsResult
    .map((post) => post.posttoprofileid)
    .filter((value, index, self) => self.indexOf(value) === index);
  const groupsWithPosts = groupsResult.filter((group) =>
    allGroupWithPosts.includes(group.ID)
  );

  const groupedPosts = groupsWithPosts.map((group) => {
    const groupPosts = postsResult
      .filter((post) => post.posttoprofileid === group.ID)
      .sort((a, b) => b.ID - a.ID)
      .slice(0, 6);

    const groupPostsInfo = groupPosts.map((post) => {
      let firstImage = "";
      if (post.metaimage) {
        firstImage = post.metaimage;
      } else if (post.imageUrl) {
        firstImage = post.imageUrl;
      }

      return {
        postID: post.ID || post.id,
        postType: post.posttype,
        sharedPostID: post.sharedpostid,
        postToSharedDesc: post.postdescription,
        shortDescription: post.shortdescription,
        postToProfileID: post.posttoprofileid,
        profileID: post.profileid,
        title: post.textpostdesc,
        image: firstImage,
      };
    });

    return {
      Id: group.ID,
      name: group.FirstName,
      groupUniqueLink: group.UniqueLink,
      posts: groupPostsInfo,
    };
  });

  return groupedPosts;
};

Profile.getGroups = async () => {
  const groupsResult = await executeQuery(
    'SELECT ID, UniqueLink, FirstName FROM profile WHERE AccountType = "G" AND IsDeleted = "N" AND IsActivated = "Y" ORDER BY FirstName'
  );

  return groupsResult;
};

Profile.getGroupBasicDetails = async (uniqueLink) => {
  const groupsResult = await executeQuery(
    'SELECT * FROM profile WHERE AccountType = "G" AND IsDeleted = "N" AND IsActivated = "Y" AND UniqueLink=? ORDER BY FirstName',
    [uniqueLink]
  );

  return groupsResult?.[0] || {};
};

Profile.getGroupPostById = async (id, limit, offset) => {
  let query = `SELECT * FROM posts WHERE isdeleted = "N" AND posttoprofileid IS NOT NULL AND posttype NOT IN ("CHAT", "TA") AND posttoprofileid=${id} ORDER BY ID DESC `;

  if (limit > 0 && offset >= 0) {
    query += `LIMIT ${limit} OFFSET ${offset}`;
  }
  const posts = await executeQuery(query);

  return posts || [];
};

Profile.getGroupFileResourcesById = async (id) => {
  const posts = await executeQuery(
    "SELECT p.ID AS PostID, p.PostDescription, p.PostCreationDate AS UploadedOn, ph.PhotoName as FileName FROM posts AS p LEFT JOIN photos as ph on p.ID = ph.PostID WHERE isdeleted = 'N' AND  p.posttype = 'F' AND (p.ProfileID = ? OR p.PostToProfileID = ?)",
    [id, id]
  );

  return posts || [];
};

Profile.images = async (data) => {
  try {
    const query = "insert into profilePictures set ?";
    const values = [data];
    const profilePic = await executeQuery(query, values);
    return profilePic.insertId;
  } catch (error) {
    return error;
  }
};

Profile.updateImages = async (data, id) => {
  try {
    const query =
      "update profilePictures set imageUrl = ?,updatedDate = ? where id = ?";
    const values = [data.imageUrl, data.updatedDate, id];
    const profilePic = await executeQuery(query, values);
    return profilePic.insertId;
  } catch (error) {
    return error;
  }
};

Profile.getProfiles = async (limit, offset) => {
  let query = `SELECT p.id as profileId,
    p.userName,
    p.userId,
    u.email,
    u.gender,
    u.birthDate,
    u.isActive,
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
    p.idealDate
  FROM profile as p left join users as u on u.id = p.userId ORDER BY p.id DESC`;
  if (limit > 0 && offset >= 0) {
    query += ` LIMIT ${limit} OFFSET ${offset}`;
  }
  let profiles = await executeQuery(query);
  const promises = profiles.map(async (element) => {
    const query1 =
      "select imageUrl,id from profilePictures where profileId = ?;";
    const value1 = [element.profileId];
    const query2 =
      "select ui.interestId,i.name from user_interests as ui left join interests as i on i.id = ui.interestId  where ui.profileId = ?;";
    const value2 = [element.profileId];
    const [profilePictures, interestList] = await Promise.all([
      executeQuery(query1, value1),
      executeQuery(query2, value2),
    ]);
    element["profilePictures"] = profilePictures;
    element["interestList"] = interestList;
    return element;
  });

  await Promise.all(promises);
  return profiles || [];
};

Profile.getProfilePictures = async (limit, offset) => {
  try {
    let query = `select pp.id,pp.profileId,pp.imageUrl,p.userName from profilePictures as pp left join profile as p on p.id = pp.profileId order by pp.id DESC`;
    if (limit > 0 && offset >= 0) {
      query += ` LIMIT ${limit} OFFSET ${offset}`;
    }
    const profilePictures = await executeQuery(query);
    return profilePictures;
  } catch (error) {
    return error;
  }
};

module.exports = Profile;
