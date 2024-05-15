const { executeQuery } = require("../helpers/utils");
const common = require("../common/common");

var UserRewardDetails = function (reward) {
  this.id = reward.id;
  this.ProfileID = reward.ProfileID;
  this.ActionType = reward.ActionType;
  this.ActionDate = reward.ActionDate;
  this.PostID = reward.PostID;
};

UserRewardDetails.create = async (reqBody) => {
  return await executeQuery("INSERT INTO userrewarddetails set ?", reqBody);
};

UserRewardDetails.getCountByProfileId = async (profileId) => {
  const currentDate = new Date();
  const thisMonthFirstDate = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const nextMonthFirstDate = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    1
  );
  const thisMonthLastDate = new Date(nextMonthFirstDate - 1);

  const countQueryValues = [profileId, thisMonthFirstDate, thisMonthLastDate];

  const monthlyCountQuery = `SELECT JSON_OBJECTAGG(ActionType, count) as json FROM (SELECT ActionType, COUNT(id) as count FROM userrewarddetails WHERE ProfileID = ? AND ActionDate >= ? AND ActionDate <= ? GROUP BY ActionType) as js`;
  const monthlyCounts = await executeQuery(monthlyCountQuery, countQueryValues);

  const allCountQuery = `SELECT JSON_OBJECTAGG(ActionType, count) as json FROM (SELECT ActionType, COUNT(id) as count FROM userrewarddetails WHERE ProfileID = ? GROUP BY ActionType) as js`;
  const allCounts = await executeQuery(allCountQuery, countQueryValues);

  return {
    monthly: monthlyCounts?.[0]?.json || {},
    all: allCounts?.[0]?.json || {},
  };
};

module.exports = UserRewardDetails;
