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
  this.profilePicName = profile.imageUrl;
  this.createdDate = profile.createdDate;
  this.updatedDate = profile.updatedDate;
  this.matchHaveChild = profile.matchHaveChild;
  this.matchIsVaccinated = profile.matchIsVaccinated;
  this.matchEducation = profile.matchEducation;
  this.matchEthnicity = profile.matchEthnicity;
  this.matchBodyType = profile.matchBodyType;
  this.matchReligion = profile.matchReligion;
  this.matchIsSmoke = profile.matchIsSmoke;
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
    p.idealDate,
    p.profilePicName,
    p.matchIsSmoke,
    p.matchReligion,
    p.matchBodyType,
    p.matchEthnicity,
    p.matchEducation,
    p.matchIsVaccinated,
    p.userStatus,
    p.matchHaveChild
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
  const query3 = `select count(id) as roomCount from chatRooms where (profileId1 = ${profile.profileId} or profileId2 = ${profile.profileId}) AND isAccepted = 'Y'`;
  const [chatRooms] = await executeQuery(query3);
  if (chatRooms.roomCount > 0) {
    profile["isChatRoomCreated"] = true;
  } else {
    profile["isChatRoomCreated"] = false;
  }
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

Profile.getUsersByUsername = async function (searchText, profileId) {
  if (searchText) {
    const query = `select p.id as Id, p.userName,p.profilePicName from profile as p left join users as u on u.id = p.userId WHERE u.isAdmin='N' AND p.userName LIKE ? AND p.id not in (SELECT UnsubscribeProfileId FROM unsubscribe_profiles where ProfileId = ${profileId}) order by p.userName limit 500`;
    const values = [`${searchText}%`];
    const searchData = await executeQuery(query, values);
    return searchData;
  } else {
    return { error: "data not found" };
  }
};

Profile.getNotificationById = async function (id, limit, offset) {
  if (id) {
    const query = `select n.*,p.userName,p.profilePicName from notifications as n left join profile as p on p.id = n.notificationByProfileId left join groupMembers as g on g.groupId = n.groupId and g.profileId != n.notificationByProfileId where g.profileId = ? OR n.notificationToProfileId =? order by n.createDate desc limit ${limit} offset ${offset}`;
    const values = [id, id];
    const searchCount = await executeQuery(
      `SELECT count(id) as count FROM notifications as n WHERE n.notificationToProfileId = ${id}`
    );
    const notificationData = await executeQuery(query, values);
    // return notificationData;
    return {
      count: searchCount?.[0]?.count || 0,
      data: notificationData,
    };
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

  const groupIds = groupsResult.map((group) => group.id);

  const postsResult = await executeQuery(
    'SELECT * FROM posts WHERE isdeleted = "N" AND posttoprofileid IS NOT NULL AND posttype NOT IN ("CHAT", "TA") AND posttoprofileid IN (?) ORDER BY id DESC',
    [groupIds]
  );

  const allGroupWithPosts = postsResult
    .map((post) => post.posttoprofileid)
    .filter((value, index, self) => self.indexOf(value) === index);
  const groupsWithPosts = groupsResult.filter((group) =>
    allGroupWithPosts.includes(group.id)
  );

  const groupedPosts = groupsWithPosts.map((group) => {
    const groupPosts = postsResult
      .filter((post) => post.posttoprofileid === group.id)
      .sort((a, b) => b.id - a.id)
      .slice(0, 6);

    const groupPostsInfo = groupPosts.map((post) => {
      let firstImage = "";
      if (post.metaimage) {
        firstImage = post.metaimage;
      } else if (post.imageUrl) {
        firstImage = post.imageUrl;
      }

      return {
        postID: post.id || post.id,
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
      Id: group.id,
      name: group.FirstName,
      groupUniqueLink: group.UniqueLink,
      posts: groupPostsInfo,
    };
  });

  return groupedPosts;
};

Profile.getGroups = async () => {
  const groupsResult = await executeQuery(
    'SELECT id, UniqueLink, FirstName FROM profile WHERE AccountType = "G" AND IsDeleted = "N" AND IsActivated = "Y" ORDER BY FirstName'
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
  let query = `SELECT * FROM posts WHERE isdeleted = "N" AND posttoprofileid IS NOT NULL AND posttype NOT IN ("CHAT", "TA") AND posttoprofileid=${id} ORDER BY id DESC `;

  if (limit > 0 && offset >= 0) {
    query += `LIMIT ${limit} OFFSET ${offset}`;
  }
  const posts = await executeQuery(query);

  return posts || [];
};

Profile.getGroupFileResourcesById = async (id) => {
  const posts = await executeQuery(
    "SELECT p.id AS PostID, p.PostDescription, p.PostCreationDate AS UploadedOn, ph.PhotoName as FileName FROM posts AS p LEFT JOIN photos as ph on p.id = ph.PostID WHERE isdeleted = 'N' AND  p.posttype = 'F' AND (p.ProfileID = ? OR p.PostToProfileID = ?)",
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

Profile.getProfiles = async (limit, offset, id, gender) => {
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
  FROM profile as p left join users as u on u.id = p.userId where p.id != ${id} and u.gender = '${
    gender === "man" ? "woman" : "man"
  }' and p.id not in (SELECT UnsubscribeProfileId FROM unsubscribe_profiles where ProfileId = ${id}) ORDER BY p.id DESC`;
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

Profile.getProfilePictures = async (limit, offset, id, gender) => {
  try {
    let query = `select pp.id,pp.profileId,pp.imageUrl,p.userName from profilePictures as pp left join profile as p on p.id = pp.profileId left join users as u on u.id = p.userId where pp.profileId != ${id} and u.gender != '${gender}' and p.id not in (SELECT UnsubscribeProfileId FROM unsubscribe_profiles where ProfileId = ${id}) order by pp.id DESC`;
    if (limit > 0 && offset >= 0) {
      query += ` LIMIT ${limit} OFFSET ${offset}`;
    }
    const profilePictures = await executeQuery(query);
    const query1 = `SELECT GROUP_CONCAT(profileId) AS profileIds FROM favourite_profiles WHERE likedByProfileId = ${id}`;
    const [favoritesProfile] = await executeQuery(query1);
    console.log(favoritesProfile);
    profilePictures.forEach((element) => {
      if (favoritesProfile?.profileIds?.includes(element.profileId)) {
        element["isFavorite"] = true;
      } else {
        element["isFavorite"] = false;
      }
    });
    return profilePictures;
  } catch (error) {
    return error;
  }
};

module.exports = Profile;
