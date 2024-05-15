"use strict";
var db = require("../../config/db.config");
const { getPagination, getPaginationData } = require("../helpers/fn");
const { executeQuery } = require("../helpers/utils");

var dashboard = function () {};

dashboard.getCount = async function () {
  const query = "select count(id) as userCount from profile";
  const query1 = "select count(id) as postCount from posts";
  const query2 = `select count(Id) as communityCount from community where pageType='community'`;
  const query3 = `select count(Id) as pageCount from community where pageType='page'`;
  const [user] = await executeQuery(query);
  const [post] = await executeQuery(query1);
  const [community] = await executeQuery(query2);
  const [page] = await executeQuery(query3);
  const data = {
    userCount: user.userCount,
    postCount: post.postCount,
    communityCount: community.communityCount,
    pageCount: page.pageCount,
  };
  return data;
};
module.exports = dashboard;
