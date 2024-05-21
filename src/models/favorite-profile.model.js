"use strict";
const { executeQuery } = require("../helpers/utils");
const moment = require("moment");
const { notificationMail } = require("../helpers/utils");

var FavoriteProfiles = function (data) {
  this.profileId = data.profileId;
  this.likedByProfileId = data.likedByProfileId;
};

FavoriteProfiles.addFavoriteProfile = async (data) => {
  try {
    const query =
      "select * from favourite_profiles where profileId = ? and likedByProfileId = ?";
    const values = [data.profileId, data.likedByProfileId];
    const profile = await executeQuery(query, values);
    if (profile.length) {
      return false;
    } else {
      const query = "insert into favourite_profiles set ?";
      const values = [data];
      const profile = await executeQuery(query, values);
      return profile.insertId;
    }
  } catch (error) {
    return error;
  }
};

FavoriteProfiles.getFavoriteProfiles = async (id) => {
  try {
    const query =
      "select p.* from favourite_profiles as fp left join profile as p on p.id = fp.profileId where fp.likedByProfileId = ?";
    const values = [id];
    const profiles = await executeQuery(query, values);
    await Promise.all(
      profiles.map(async (ele) => {
        const query1 =
          "select imageUrl, id from profilePictures where profileId = ?;";
        const value1 = [ele.id];
        const profilePictures = await executeQuery(query1, value1);
        ele["profilePictures"] = profilePictures;
      })
    );
    return profiles;
  } catch (error) {
    return error;
  }
};

FavoriteProfiles.removeFromFavorite = async (id, profileId) => {
  try {
    const query =
      "delete from favourite_profiles where likedByProfileId = ? and profileId = ?";
    const values = [id, profileId];
    const profiles = await executeQuery(query, values);
    return profiles;
  } catch (error) {
    return error;
  }
};

module.exports = FavoriteProfiles;
