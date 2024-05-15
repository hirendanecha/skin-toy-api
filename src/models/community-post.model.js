var db = require("../../config/db.config");
const common = require("../common/common");
const environment = require("../environments/environment");
const { executeQuery } = require("../helpers/utils");

var CommunityPost = function (post) {
  this.description = post.description;
  this.imageUrl = post.imageUrl;
  this.postType = post.posttype || "S";
  this.profileid = post.profileid;
  this.communityId = post.communityId;
  this.metalink = post.metalink;
};

CommunityPost.findAll = async function (limit, offset, search) {
  const whereCondition = `pr.userName LIKE '%${search}%'`;
  console.log(whereCondition);
  const searchCount = await executeQuery(
    `SELECT count(c.Id) as count FROM communityPosts as c left join profile as pr on c.profileId = pr.Id WHERE ${whereCondition}`
  );

  const searchData = await executeQuery(
    `SELECT p.*, pr.profilePicName, pr.userName  from communityPosts as p left join profile as pr on p.profileId = pr.id where ${whereCondition} order by p.createdDate DESC limit ? offset ?`,
    [limit, offset]
  );
  return {
    count: searchCount?.[0]?.count || 0,
    data: searchData,
  };
};

CommunityPost.getCommunityPostById = function (profileId, result) {
  db.query(
    // "SELECT * from posts where isdeleted ='N' order by postcreationdate DESC limit 15 ",
    "SELECT p.*, pr.profilePicName, pr.userName  from communityPosts as p left join profile as pr on p.profileid = pr.id where p.communityId =? order by p.createdDate DESC limit 15;",
    profileId,
    function (err, res) {
      if (err) {
        console.log("error", err);
        result(err, null);
      } else {
        // console.log("post: ", res);
        result(null, res);
      }
    }
  );
};

CommunityPost.create = function (postData, result) {
  db.query("INSERT INTO communityPosts set ?", postData, function (err, res) {
    if (err) {
      console.log(err);
      result(err, null);
    } else {
      result(null, res.insertId);
    }
  });
};

CommunityPost.deletePost = async function (id, result) {
  db.query(
    "delete from communityPosts where Id = ?",
    [id],
    function (err, res) {
      if (err) {
        console.log("error", err);
        result(err, null);
      } else {
        console.log("Post deleted sucessfully", res);
        result(null, res);
      }
    }
  );
  // const query = "delete from communityPosts where Id= ?";
  // const values = [id];
  // const data = await executeQuery(query, values);
  // return data;
};

CommunityPost.getPostByPostId = function (id, result) {
  db.query(
    // "SELECT * from posts where isdeleted ='N' order by postcreationdate DESC limit 15 ",
    "SELECT p.* from communityPosts as p left join profile as pr on p.profileId = pr.id where  p.Id =?;",
    id,
    function (err, res) {
      if (err) {
        console.log("error", err);
        result(err, null);
      } else {
        // console.log("post: ", res);
        result(null, res);
      }
    }
  );
};

module.exports = CommunityPost;
