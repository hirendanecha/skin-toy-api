const { executeQuery } = require("../helpers/utils");
require("../common/common")();

var UserRewards = function (reward) {
  this.PROFILE_ID = reward.PROFILE_ID;
  this.POST_COUNT = reward.POST_COUNT;
  this.VIEW_COUNT = reward.VIEW_COUNT;
  this.LIKES_COUNT = reward.LIKES_COUNT;
  this.SHARES_COUNT = reward.SHARES_COUNT;
  this.REFERRALS_COUNT = reward.REFERRALS_COUNT;
  this.FM_COUNT = reward.FM_COUNT;
  this.ACTION_IDEA_COUNT = reward.ACTION_IDEA_COUNT;
  this.FACEBOOK_SHARES_COUNT = reward.FACEBOOK_SHARES_COUNT;
  this.POSTTOKEN = reward.POSTTOKEN;
  this.VIEWTOKEN = reward.VIEWTOKEN;
  this.LIKESTOKEN = reward.LIKESTOKEN;
  this.SHARESTOKEN = reward.SHARESTOKEN;
  this.REFERRALSTOKEN = reward.REFERRALSTOKEN;
  this.FMTOKEN = reward.FMTOKEN;
  this.ACTIONIDEATOKEN = reward.ACTIONIDEATOKEN;
  this.FBTOKEN = reward.FBTOKEN;
  this.TOTALTOKEN = reward.TOTALTOKEN;
};

module.exports = UserRewards;