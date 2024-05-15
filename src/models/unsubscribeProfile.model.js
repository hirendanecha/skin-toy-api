const { executeQuery } = require("../helpers/utils");
const common = require("../common/common");

class UnsubscribeProfile {
  constructor(data) {
    this.profileId = data.profileId;
    this.unsubscribeProfileId = data.unsubscribeProfileId;
  }

  static async create(reqBody) {
    return await executeQuery(
      "INSERT INTO unsubscribe_profiles set ?",
      reqBody
    );
  }

  static async remove(id) {
    return await executeQuery("DELETE FROM unsubscribe_profiles WHERE Id=?;", [
      id,
    ]);
  }

  static async getByProfileId(profileId) {
    return (
      (await executeQuery(
        `SELECT unsub_pr.Id, pr.profilePicName,pr.userName,pr.id as profileId from unsubscribe_profiles as unsub_pr left join profile as pr on unsub_pr.unsubscribeProfileId = pr.id where unsub_pr.profileId = ?`,
        [profileId]
      )) || []
    );
  }
}

module.exports = UnsubscribeProfile;
