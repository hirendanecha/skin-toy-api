const { executeQuery } = require("../helpers/utils");
const common = require("../common/common");

class SeeFirstUser {
  constructor(data) {
    this.profileId = data.profileId;
    this.seeFirstProfileId = data.seeFirstProfileId;
  }

  static async create(reqBody) {
    return await executeQuery("INSERT INTO see_first_profile set ?", reqBody);
  }

  static async remove(id) {
    return await executeQuery("DELETE FROM see_first_profile WHERE Id=?;", [
      id,
    ]);
  }
  static async removeByProfileIdAndSeeFirstId(profileId, seeFirstProfileId) {
    return await executeQuery(
      "DELETE FROM see_first_profile WHERE ProfileId=? AND SeeFirstProfileId=?;",
      [profileId, seeFirstProfileId]
    );
  }

  static async getByProfileId(profileId) {
    return (
      (await executeQuery(
        `SELECT sf_pr.Id, pr.profilePicName, pr.userName  from see_first_profile as sf_pr left join profile as pr on sf_pr.seeFirstProfileId = pr.id where sf_pr.profileId = ?`,
        [profileId]
      )) || []
    );
  }

  static async getSeefirstIdByProfileId(profileId) {
    return (
      (await executeQuery(
        `SELECT SeeFirstProfileId from see_first_profile where profileId = ?`,
        [profileId]
      )) || []
    );
  }
}

module.exports = SeeFirstUser;
