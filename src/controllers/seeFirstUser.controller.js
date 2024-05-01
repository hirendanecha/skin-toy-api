const utils = require("../helpers/utils");
const SeeFirstUser = require("../models/seeFirstUser.model");

exports.create = async (req, res) => {
  try {
    if (Object.keys(req.body).length === 0) {
      res.status(400).send({ error: true, message: "Error in application" });
    } else {
      const reqBody = new SeeFirstUser(req.body);
      const data = await SeeFirstUser.create(reqBody);

      if (data) {
        return res.json({
          error: false,
          message: "See first user Created",
          data: data,
        });
      }
    }
  } catch (error) {
    return utils.send500(res, error);
  }
};

exports.remove = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await SeeFirstUser.remove(id);

    if (data) {
      return res.json({
        error: false,
        message: "See first user Removed",
        data: data,
      });
    }
  } catch (error) {
    return utils.send500(res, error);
  }
};
exports.removeByProfileIdAndSeeFirstId = async (req, res) => {
  try {
    const profileId = req.params.profileId;
    const seeFirstProfileId = req.params.seeFirstProfileId;
    const data = await SeeFirstUser.removeByProfileIdAndSeeFirstId(
      profileId,
      seeFirstProfileId
    );

    if (data) {
      return res.json({
        error: false,
        message: "See first user Removed",
        data: data,
      });
    }
  } catch (error) {
    return utils.send500(res, error);
  }
};

exports.getByProfileId = async (req, res) => {
  const profileId = req.params.profileId;
  const data = await SeeFirstUser.getByProfileId(profileId);
  return res.send(data);
};
exports.getSeefirstIdByProfileId = async (req, res) => {
  const profileId = req.params.profileId;
  const data = await SeeFirstUser.getSeefirstIdByProfileId(profileId);
  return res.send(data);
};
