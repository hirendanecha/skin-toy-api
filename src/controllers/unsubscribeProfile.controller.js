const UnsubscribeProfile = require("../models/unsubscribeProfile.model");
const utils = require("../helpers/utils");

exports.create = async (req, res) => {
  try {
    if (Object.keys(req.body).length === 0) {
      res.status(400).send({ error: true, message: "Error in application" });
    } else {
      const reqBody = new UnsubscribeProfile(req.body);
      const data = await UnsubscribeProfile.create(reqBody);

      if (data) {
        return res.json({
          error: false,
          message: "Unsubscribe Profile Created",
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
    const data = await UnsubscribeProfile.remove(id);

    if (data) {
      return res.json({
        error: false,
        message: "Unsubscribe Profile Removed",
        data: data,
      });
    }
  } catch (error) {
    return utils.send500(res, error);
  }
};

exports.getByProfileId = async (req, res) => {
  const profileId = req.params.profileId;
  console.log(profileId);
  const data = await UnsubscribeProfile.getByProfileId(profileId);
  console.log(data);
  return res.send(data);
};
