const UserRewardDetails = require("../models/userRewardDetails.model");
const utils = require("../helpers/utils");

exports.getCountByProfileId = async (req, res) => {  
  try {
    const profileId = req?.params?.profileId;
    
    if (profileId) {
      const counts = await UserRewardDetails.getCountByProfileId(profileId);

      if (counts) {
        return res.json({
          error: false,
          message: "Get counts",
          data: counts,
        });
      }    
    }

    return res.status(400).send({ error: true, message: "Error in application" });
  } catch (error) {
    return utils.send500(res, error);
  }
};