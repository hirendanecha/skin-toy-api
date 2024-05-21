const FavoriteProfiles = require("../models/favorite-profile.model");
const utils = require("../helpers/utils");
const {
  getPagination,
  getCount,
  getPaginationData,
  executeQuery,
} = require("../helpers/fn");

exports.addFavoriteProfile = async (req, res) => {
  try {
    const reqData = req.body;
    const id = await FavoriteProfiles.addFavoriteProfile(reqData);
    if (id) {
      return res.send({
        id: id,
        message: "profile added to favorites successfully",
      });
    } else {
      return res.send({ error: true, message: "Error while adding profile" });
    }
  } catch (error) {
    return utils.send500(res, error);
  }
};

exports.getFavoriteProfiles = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await FavoriteProfiles.getFavoriteProfiles(id);
    if (data) {
      return res.send({
        data: data,
        error: false,
      });
    } else {
      return res.send({ error: false, message: "no profiles found" });
    }
  } catch (error) {
    return utils.send500(res, error);
  }
};

exports.removeFromFavorite = async (req, res) => {
  try {
    const { id } = req.params;
    const { profileId } = req.query;
    const data = await FavoriteProfiles.removeFromFavorite(id, profileId);
    if (data) {
      return res.send({
        message: "profile removed from favorites successfully",
        error: false,
      });
    } else {
      return res.send({ error: false, message: "no profiles found" });
    }
  } catch (error) {
    return utils.send500(res, error);
  }
};
