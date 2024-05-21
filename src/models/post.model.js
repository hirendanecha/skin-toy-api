var db = require("../../config/db.config");
const common = require("../common/common");
const { getPagination, getPaginationData } = require("../helpers/fn");
const { executeQuery } = require("../helpers/utils");
const { notificationMail } = require("../helpers/utils");
const { createNotification } = require("../service/socket-service");

var Post = function (post) {
  this.id = post.id;
  this.postdescription = post.postdescription;
  this.keywords = post.keywords;
  this.posttoprofileid = post.posttoprofileid;
  this.textpostdesc = post.textpostdesc;
  this.imageUrl = post.imageUrl;
  this.posttype = post.posttype || "S";
  this.profileid = post.profileid;
  this.isdeleted = "N";
  this.title = post?.title;
  this.metalink = post?.metalink;
  this.metadescription = post?.metadescription;
  this.metaimage = post?.metaimage;
  this.streamname = post?.streamname;
  this.thumbfilename = post?.thumbfilename;
  this.albumname = post?.albumname;
  this.videoduration = post?.videoduration;
  this.communityId = post?.communityId;
  this.channelId = post?.channelId || null;
  this.keywords = post?.keywords || null;
  this.pdfUrl = post?.pdfUrl || null;
};

// Post.findAll = async function (limit, offset, search) {
//   const whereCondition = `${
//     search
//       ? `p.isdeleted ='N' AND p.postdescription !='' AND pr.userName LIKE '%${search}%'`
//       : `p.isdeleted ='N' AND p.postdescription !=''`
//   }`;
//   console.log(whereCondition);
//   const postCount = await executeQuery(
//     `SELECT count(p.id) as count FROM posts as p left join profile as pr on p.profileid = pr.Id WHERE ${whereCondition}`
//   );

//   const postData = await executeQuery(
//     `SELECT p.*, pr.profilePicName, pr.userName,  from posts as p left join profile as pr on p.profileid = pr.id where ${whereCondition} order by p.postcreationdate DESC limit ? offset ?`,
//     [limit, offset]
//   );
//   return {
//     count: postCount?.[0]?.count || 0,
//     data: postData,
//   };
// };

Post.findAll = async function (params) {
  const { page, size, profileId, communityId } = params;
  const { limit, offset } = getPagination(page, size);
  const communityCondition = communityId
    ? `p.communityId = ${communityId} AND p.posttype in ('S', 'R','V') AND`
    : "p.communityId IS NULL AND p.posttype in ('S', 'R','V') AND";

  const query = `SELECT p.*, pl.ActionType as react, pr.profilePicName, pr.userName
  from 
  posts as p left join postlikedislike as pl on pl.ProfileID = ? and pl.PostID = p.id left join profile as pr on p.profileid = pr.id
  where ${communityCondition}
  p.profileid not in (SELECT UnsubscribeProfileId FROM unsubscribe_profiles where ProfileId = ?) AND p.isdeleted ='N' order by p.profileid in (SELECT SeeFirstProfileId from see_first_profile where ProfileId=?) DESC, p.id DESC limit ? offset ?`;
  const values = [profileId, profileId, profileId, limit, offset];
  const posts = await executeQuery(query, values);
  const query1 = `SELECT GROUP_CONCAT(profileId) AS profileIds FROM favourite_profiles WHERE likedByProfileId = ${profileId}`;
  const [favoritesProfile] = await executeQuery(query1);
  posts.forEach((element) => {
    if (favoritesProfile?.profileIds?.includes(element.profileid)) {
      element["isFavorite"] = true;
    } else {
      element["isFavorite"] = false;
    }
  });

  return getPaginationData(
    {
      count: 100,
      docs: posts,
    },
    page,
    limit
  );
};

Post.getPostByProfileId = async function (params) {
  const { page, size, profileId, startDate, endDate } = params;
  const { limit, offset } = getPagination(page, size);
  let whereCondition = "";
  if (startDate && endDate) {
    whereCondition += `AND p.postcreationdate >= '${startDate}' AND p.postcreationdate <= '${endDate}'`;
    console.log(whereCondition);
  } else if (startDate) {
    whereCondition += `AND p.postcreationdate >= '${startDate}'`;
  } else if (endDate) {
    whereCondition += `AND p.postcreationdate <= '${endDate}'`;
  }
  const query = `SELECT p.*, pr.profilePicName, pr.userName from posts as p left join profile as pr on p.profileid = pr.id  where p.isdeleted ='N' and p.profileid =? and p.posttype in ('S', 'R','V') ${whereCondition} order by p.postcreationdate DESC limit ? offset ?;`;
  const values = [profileId, limit, offset];
  const postData = await executeQuery(query, values);
  const query1 = `SELECT GROUP_CONCAT(profileId) AS profileIds FROM favourite_profiles WHERE likedByProfileId = ${profileId}`;
  const [favoritesProfile] = await executeQuery(query1);
  postData.forEach((element) => {
    if (favoritesProfile?.profileIds?.includes(element.profileid)) {
      element["isFavorite"] = true;
    } else {
      element["isFavorite"] = false;
    }
  });
  // return postData;
  return getPaginationData(
    {
      count: postData.length,
      docs: postData,
    },
    page,
    limit
  );
};
Post.getPostByPostId = function (profileId, result) {
  db.query(
    // "SELECT * from posts where isdeleted ='N' order by postcreationdate DESC limit 15 ",
    "SELECT p.*, pr.profilePicName, pr.userName from posts as p left join profile as pr on p.profileid = pr.id  where p.isdeleted ='N' and p.id =? ;",
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

Post.getPdfsFile = function (profileId, result) {
  db.query(
    // "SELECT * from posts where isdeleted ='N' order by postcreationdate DESC limit 15 ",
    "SELECT p.*, pr.profilePicName, pr.userName  from posts as p left join profile as pr on p.profileid = pr.id where p.isdeleted ='N' and p.pdfUrl is not null and p.profileid =? ;",
    +profileId,
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

Post.create = async function (postData) {
  const query = postData?.id
    ? `update posts set ? where id= ?`
    : `INSERT INTO posts set ?`;
  const values = postData?.id ? [postData, postData?.id] : [postData];
  const post = await executeQuery(query, values);
  console.log("post : ", post);

  const notifications = [];
  if (postData?.tags?.length > 0) {
    for (const key in postData?.tags) {
      if (Object.hasOwnProperty.call(postData?.tags, key)) {
        const tag = postData?.tags[key];

        const notification = await createNotification({
          notificationToProfileId: tag?.id,
          postId: postData?.id || post.insertId,
          notificationByProfileId: postData?.profileid,
          actionType: "T",
        });
        console.log(notification);
        const findUser = `select u.email,p.userName from users as u left join profile as p on p.userId = u.id where p.id = ?`;
        const values = [tag?.id];
        const userData = await executeQuery(findUser, values);
        const findSenderUser = `select p.id,p.userName from profile as p where p.id = ?`;
        const values1 = [postData?.profileid];
        const senderData = await executeQuery(findSenderUser, values1);
        notifications.push(notification);
        if (tag?.id) {
          const userDetails = {
            email: userData[0].email,
            profileId: senderData[0].id,
            userName: senderData[0].userName,
            firstName: userData[0].FirstName,
            lastName: userData[0].LastName,
            postId: notification?.postId || postData?.id,
          };
          await notificationMail(userDetails);
        }
      }
    }
  }
  return post;
};

Post.delete = async function (id) {
  // db.query("DELETE FROM posts WHERE id = ?", [id], function (err, res) {
  //   if (err) {
  //     console.log("error", err);
  //     result(err, null);
  //   } else {
  //     console.log("Post deleted sucessfully", res);
  //     result(null, res);
  //   }
  // });
  const query = "DELETE FROM posts WHERE id = ?";
  const query1 = "DELETE FROM comments WHERE postId = ?";
  const value = [id];
  const deletePost = await executeQuery(query, value);
  const deleteComments = await executeQuery(query1, value);
  return deletePost;
};

Post.deletePostComment = function (id, result) {
  db.query("DELETE FROM comments WHERE id = ?", [id], function (err, res) {
    if (err) {
      console.log("error", err);
      result(err, null);
    } else {
      result(null, res);
    }
  });
};
Post.deleteAllData = async function (id) {
  const query = "delete from comments where profileId = ?";
  const query1 = "delete from posts where profileid = ?";
  const query2 = "delete from communityMembers where profileId = ?";
  const query3 = "delete from community where profileId = ?";
  const query4 = "delete from see_first_profile where profileId = ?";
  const query5 = "delete from unsubscribe_profiles where profileId = ?";
  const values = [id];
  await executeQuery(query, values);
  await executeQuery(query1, values);
  await executeQuery(query2, values);
  await executeQuery(query3, values);
  await executeQuery(query4, values);
  await executeQuery(query5, values);
  return;
};

Post.getPostComments = async function (profileId, postId) {
  // db.query(
  //   "select c.*,pr.profilePicName, pr.userName,  from comments as c left join profile as pr on pr.id = c.profileId where c.postId = ?",
  //   [id],
  //   function (err, res) {
  //     if (err) {
  //       console.log("error", err);
  //       result(err, null);
  //     } else {
  //       result(null, res);
  //     }
  //   }
  // );

  const query =
    "select c.*,pr.profilePicName,pr.userName,cl.actionType as react from comments as c left join commentsLikesDislikes as cl on cl.profileId = ? AND cl.commentId = c.id left join profile as pr on pr.id = c.profileId where c.postId = ? and c.parentCommentId is NULL";
  const values = [profileId, postId];
  const commmentsList = await executeQuery(query, values);
  if (commmentsList.length >= 0) {
    const ids = commmentsList.map((ele) => Number(ele.id)).join(",");
    console.log(ids);
    const query = `select c.*,pr.profilePicName, pr.userName, cl.actionType as react from comments as c left join commentsLikesDislikes as cl on cl.profileId = ? AND cl.commentId = c.id left join profile as pr on pr.id = c.profileId where c.parentCommentId in (${
      ids || null
    })`;
    const values = [profileId];
    const replyCommnetsList = await executeQuery(query, values);
    const countQuery = `select count(id) as count from comments where postId = ${postId} `;
    const [{ count }] = await executeQuery(countQuery);
    console.log(count, "comments count");

    return {
      commmentsList,
      replyCommnetsList,
      count,
    };
  } else {
    return null;
  }
};

Post.editPost = async function (post) {
  const query = "update posts set ? where id = ?";
  const values = [post, post.id];
  const postData = await executeQuery(query, values);
};

Post.updateViewCount = async function (id, viewcount) {
  const query = "update posts set viewcount = ? where id = ?";
  const values = [viewcount, id];
  const postData = await executeQuery(query, values);
  return postData;
};

module.exports = Post;
