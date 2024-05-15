const { executeQuery } = require("../helpers/utils");
const { notificationMail } = require("../helpers/utils");
const { getPagination, getCount, getPaginationData } = require("../helpers/fn");
const { param } = require("../routes");
const UserRewardDetails = require("../models/userRewardDetails.model");

exports.getPost = async function (data) {
  return await getPost(data);
};
exports.createPost = function (data) {
  try {
    return createNewPost(data);
  } catch (error) {
    console.log("createpost", error);
    return Promise.reject(error);
  }
};
exports.createCommunity = async function (data) {
  return await createCommunity(data);
};
exports.getCommunityPost = async function (data) {
  return await getCommunityPost(data);
};
exports.createCommunityPost = async function (data) {
  return await createCommunityPost(data);
};
exports.getCommunity = async function (data) {
  return await getCommunity(data);
};

exports.getUnApproveCommunity = async function (data) {
  return await getUnApproveCommunity(data);
};

exports.getApproveCommunity = async function (data) {
  return await getApproveCommunity(data);
};

exports.likeFeedPost = async function (data) {
  return await likeFeedPost(data);
};

exports.disLikeFeedPost = async function (data) {
  return await disLikeFeedPost(data);
};

exports.createNotification = async function (data) {
  return await createNotification(data);
};

exports.createComments = async function (data) {
  return await createComments(data);
};

exports.likeFeedComment = async function (data) {
  return await likeFeedComment(data);
};

exports.disLikeFeedComment = async function (data) {
  return await disLikeFeedComment(data);
};
exports.deletePost = async function (data) {
  return await deletePost(data);
};

const getPost = async function (params) {
  const { page, size, profileId, communityId } = params;
  const { limit, offset } = getPagination(page, size);
  const communityCondition = communityId
    ? `p.communityId = ${communityId} AND`
    : "p.communityId IS NULL AND";

  const query = `SELECT p.*, pl.ActionType as react, pr.profilePicName, pr.userName
  from 
  posts as p left join postlikedislike as pl on pl.ProfileID = ? and pl.PostID = p.id  left join profile as pr on p.profileid = pr.id 
  where ${communityCondition}
  p.profileid not in (SELECT UnsubscribeProfileId FROM unsubscribe_profiles where ProfileId = ?) DESC, p.id DESC limit ? offset ?`;
  // AND p.isdeleted ='N' order by p.profileid in (SELECT SeeFirstProfileId from see_first_profile where ProfileId=?)
  const values = [profileId, profileId, profileId, limit, offset];
  const posts = await executeQuery(query, values);
  // if (posts.length > 0) {
  //   for (const key in posts) {
  //     if (Object.hasOwnProperty.call(posts, key)) {
  //       const post = posts[key];
  //       const query =
  //         "select c.*,pr.profilePicName, pr.userName,  from comments as c left join profile as pr on pr.id = c.profileId where c.postId = ?";
  //       const value = [post.id];
  //       const comment = await executeQuery(query, value);
  //       post.commentList = comment;
  //     }
  //   }
  // }
  return posts;
};

const createNewPost = async function (data) {
  console.log(data);
  const postData = {
    profileid: data?.profileid,
    title: data?.meta?.title || data?.title || null,
    metadescription:
      data?.meta?.metadescription?.toString() ||
      data?.metadescription?.toString() ||
      null,
    metaimage: data?.meta?.metaimage || data?.metaimage || null,
    metalink: data?.meta?.metalink || data?.metalink || null,
    postdescription: data?.postdescription,
    communityId: data?.communityId || null,
    imageUrl: data?.imageUrl || null,
    streamname: data?.streamname || null,
    thumbfilename: data?.thumbfilename || null,
    albumname: data?.albumname || null,
    videoduration: data?.videoduration || null,
    posttype: data?.posttype || "S",
    keywords: data?.keywords || null,
    pdfUrl: data?.pdfUrl || null,
    textpostdesc: data?.textpostdesc || null,
    parentPostId: data?.parentPostId || null,
    posttoprofileid: data?.posttoprofileid || null,
  };
  postData.isdeleted = "N";

  console.log("postData", postData);
  const query = data?.id
    ? `update posts set ? where id= ?`
    : `INSERT INTO posts set ?`;
  const values = data?.id ? [postData, data?.id] : [postData];
  const post = await executeQuery(query, values);

  const notifications = [];
  if (post) {
    if (post?.insertId) {
      await UserRewardDetails.create({
        ProfileID: postData?.profileid,
        PostID: post?.insertId,
        ActionType: "P",
      });
    }

    if (data?.tags?.length > 0) {
      for (const key in data?.tags) {
        if (Object.hasOwnProperty.call(data?.tags, key)) {
          const tag = data?.tags[key];

          const notification = await createNotification({
            notificationToProfileId: tag?.id,
            postId: data?.id || post.insertId,
            notificationByProfileId: postData?.profileid,
            actionType: "T",
          });
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
              userName: userData[0].userName,
              senderUsername: senderData[0].userName,
              type: "post",
              postId: notification?.postId || postData?.id,
            };
            await notificationMail(userDetails);
          }
        }
      }
    }

    const query1 = `SELECT p.*, pr.profilePicName, pr.userName from posts as p left join profile as pr on p.profileid = pr.id where p.isdeleted ='N' and p.id =? ;`;
    const values1 = [data?.id || post.insertId];
    const posts = await executeQuery(query1, values1);
    return { notifications, posts };
  }
};

const createCommunity = async function (params) {
  const query = `INSERT INTO community set ?`;
  const values = [data];
  const community = await executeQuery(query, values);
  return community.insertId;
};

const createCommunityPost = async function (data) {
  const query = `INSERT INTO communityPosts set ?`;
  const values = [data];
  const post = await executeQuery(query, values);
  if (post.insertId) {
    const query1 = `SELECT p.*, pr.profilePicName, pr.userName from communityPosts as p left join profile as pr on p.profileId = pr.id where p.Id=?`;
    const values1 = [post.insertId];
    const posts = await executeQuery(query1, values1);
    return posts;
  }
};

const getCommunityPost = async function (params) {
  const { page, size, profileId } = params;
  const { limit, offset } = getPagination(page, size);
  const query = `SELECT p.*,pl.ActionType as react, pr.profilePicName, pr.userName from communityPosts as p left join postlikedislike as pl on pl.ProfileID = ? and pl.communityPostId = p.Id left join profile as pr on p.profileId = pr.id order by p.createdDate DESC limit ? offset ?`;
  const values = [profileId, limit, offset];
  const posts = await executeQuery(query, values);
  return posts;
};

const getCommunity = async function (params) {
  const { id } = params;
  const query =
    "select c.*,count(cm.profileId) as members from community as c left join communityMembers as cm on cm.communityId = c.Id where c.isApprove = 'Y' AND cm.profileId != ? group by c.Id;";
  const communityList = await executeQuery(query, [id]);
  return communityList;
};

// socket for admin //

const getUnApproveCommunity = async function (params) {
  const { page, size } = params;
  const { limit, offset } = getPagination(page, size);
  const query = `select c.*,count(cm.profileId) as members from community as c left join communityMembers as cm on cm.communityId = c.Id where c.isApprove = 'N' group by c.Id order by c.creationDate DESC limit ? offset ?`;
  const values = [limit, offset];
  const communitYList = await executeQuery(query, values);
  return communitYList;
};

const getApproveCommunity = async function (params) {
  const { page, size } = params;
  const { limit, offset } = getPagination(page, size);
  const query = `select c.*,count(cm.profileId) as members from community as c left join communityMembers as cm on cm.communityId = c.Id where c.isApprove = 'Y' group by c.Id order by c.creationDate DESC limit ? offset ?`;
  const values = [limit, offset];
  const communitYList = await executeQuery(query, values);
  return communitYList;
};

const likeFeedPost = async function (params) {
  const { postId, communityPostId, profileId, likeCount, actionType } = params;
  if (postId) {
    const query = `update posts set likescount = ? where id =?`;
    const query1 = `INSERT INTO postlikedislike set ?`;
    const values = [likeCount, postId];
    const data = {
      PostID: postId,
      ProfileID: profileId,
      ActionType: actionType,
    };
    const values1 = [data];
    const post = await executeQuery(query, values);
    const likeData = await executeQuery(query1, values1);
    if (likeData) {
      await UserRewardDetails.create({
        ProfileID: profileId,
        PostID: postId,
        ActionType: "L",
      });
    }
    const query3 = `SELECT p.*, pr.profilePicName, pr.userName from posts as p left join profile as pr on p.profileid = pr.id where p.id=?`;
    const values3 = [postId];
    const posts = await executeQuery(query3, values3);
    return { posts };
  }
  // else if (communityPostId) {
  //   const query = `update communityPosts set likescount = ? where Id =?`;
  //   const query1 = `INSERT INTO postlikedislike set ?`;
  //   const values = [likeCount, communityPostId];
  //   const data = {
  //     communityPostId: communityPostId,
  //     ProfileID: profileId,
  //     ActionType: actionType,
  //   };
  //   const values1 = [data];
  //   const post = await executeQuery(query, values);
  //   const likeData = await executeQuery(query1, values1);
  //   // const postData = await getPost({ page: 1, size: 15, profileId: profileId });
  //   // return postData;
  //   const query3 = `SELECT p.*, pr.profilePicName, pr.userName,  from posts as p left join profile as pr on p.profileid = pr.id where p.id=?`;
  //   const values3 = [postId];
  //   const posts = await executeQuery(query3, values3);
  //   return { posts };
  // }
};

const disLikeFeedPost = async function (params) {
  const { postId, communityPostId, profileId, likeCount } = params;
  if (postId) {
    const query = `update posts set likescount = ? where id =?`;
    const query1 = `delete from postlikedislike where PostID = ? AND ProfileID = ?`;
    const values = [likeCount, postId];
    const values1 = [postId, profileId];
    const post = await executeQuery(query, values);
    const likeData = await executeQuery(query1, values1);
    const query3 = `SELECT p.*, pr.profilePicName, pr.userName from posts as p left join profile as pr on p.profileid = pr.id where p.id=?`;
    const values3 = [postId];
    const posts = await executeQuery(query3, values3);
    return { posts };
    // const postData = await getPost({ profileId: profileId, page: 1, size: 15 });
    // return postData;
  }
  // else if (communityPostId) {
  //   const query = `update communityPosts set likescount = ? where id =?`;
  //   const query1 = `delete from postlikedislike where communityPostId = ? AND ProfileID = ?`;
  //   const values = [likeCount, communityPostId];
  //   const values1 = [communityPostId, profileId];
  //   const post = await executeQuery(query, values);
  //   const likeData = await executeQuery(query1, values1);
  //   // const postData = await getPost({
  //   //   profileId: profileId,
  //   //   page: 1,
  //   //   size: 15,
  //   // });
  //   // return postData;
  //   const query3 = `SELECT p.*, pr.profilePicName, pr.userName,  from posts as p left join profile as pr on p.profileid = pr.id where p.id=?`;
  //   const values3 = [postId];
  //   const posts = await executeQuery(query3, values3);
  //   return { posts };
  // }
};

const createNotification = async function (params) {
  const {
    notificationToProfileId,
    postId,
    notificationByProfileId,
    actionType,
    commentId,
  } = params;
  const query = "SELECT id,profilePicName, userName from profile where id = ?";
  const values = [notificationByProfileId];
  const userData = await executeQuery(query, values);
  let desc = "";
  if (commentId && actionType === "L") {
    desc = `${userData[0]?.userName} liked your Comment.`;
  } else if (commentId && actionType === "T") {
    desc = `You were tagged in ${userData[0]?.userName}'s comment.`;
  } else {
    desc =
      actionType === "R"
        ? `${userData[0]?.userName} replied to your comment`
        : actionType === "C"
        ? `${userData[0]?.userName} commented on your post`
        : actionType === "T"
        ? `You were tagged in ${userData[0]?.userName}'s post.`
        : `${userData[0]?.userName} liked your post.`;
  }
  console.log("desc===>", desc);

  const data = {
    notificationToProfileId: Number(notificationToProfileId),
    postId: postId,
    notificationByProfileId: Number(notificationByProfileId),
    actionType: actionType,
    notificationDesc: desc,
  };
  if (data.notificationByProfileId === data.notificationToProfileId) {
    return true;
  } else {
    const find =
      "select * from notifications where postId= ? and notificationByProfileId = ?";
    const value = [data.postId, data.notificationByProfileId];
    const oldData = await executeQuery(find, value);
    // if (oldData.length) {
    //   return oldData[0];
    // } else {
    // }
    const query1 = "insert into notifications set ?";
    const values1 = [data];
    const notificationData = await executeQuery(query1, values1);
    return { ...data, id: notificationData.insertId };
  }
};

const createComments = async function (params) {
  const data = {
    postId: params?.postId,
    profileId: params?.profileId,
    comment: params?.comment,
    parentCommentId: params?.parentCommentId,
    imageUrl: params?.imageUrl,
    title: params?.meta?.title || params?.title || null,
    metadescription:
      params?.meta?.metadescription?.toString() ||
      params?.metadescription?.toString() ||
      null,
    metaimage: params?.meta?.metaimage || params?.metaimage || null,
    metalink: params?.meta?.metalink || params?.metalink || null,
  };
  const query = params.id
    ? "update comments set ? where Id = ?"
    : "insert into comments set ?";
  const values = params.id ? [data, params.id] : [data];
  const commentData = await executeQuery(query, values);
  let notifications = [];
  let notification = {};
  if (data.parentCommentId) {
    const query1 = "select profileId from comments where postId= ?";
    const value = [data.postId];
    const comments = await executeQuery(query1, value);
    notification = await createNotification({
      notificationToProfileId: comments[0].profileId,
      postId: data.postId,
      notificationByProfileId: data?.profileId,
      actionType: "R",
      commentId: params?.id || commentData.insertId,
    });
  } else {
    const query1 = "select profileid from posts where id= ?";
    const value = [data.postId];
    const posts = await executeQuery(query1, value);
    notification = await createNotification({
      notificationToProfileId: posts[0].profileid,
      postId: data.postId,
      notificationByProfileId: data?.profileId,
      actionType: "C",
      commentId: params?.id || commentData.insertId,
    });
    if (params?.tags?.length > 0) {
      for (const key in params?.tags) {
        if (Object.hasOwnProperty.call(params?.tags, key)) {
          const tag = params?.tags[key];

          const notification = await createNotification({
            notificationToProfileId: tag?.id,
            postId: data.postId,
            notificationByProfileId: data?.profileId,
            actionType: "T",
            commentId: params?.id || commentData.insertId,
          });
          console.log("notification", notification);
          const findUser = `select u.email,p.userName from users as u left join profile as p on p.userId = u.id where p.id = ?`;
          const values = [tag?.id];
          const userData = await executeQuery(findUser, values);
          const findSenderUser = `select p.id,p.userName from profile as p where p.id = ?`;
          const values1 = [data?.profileId];
          const senderData = await executeQuery(findSenderUser, values1);
          notifications.push(notification);
          if (tag?.id) {
            const userDetails = {
              email: userData[0].email,
              profileId: senderData[0].id,
              userName: userData[0].userName,
              senderUsername: senderData[0].userName,
              type: "comment",
              postId: notification?.postId || postData?.id,
            };
            await notificationMail(userDetails);
          }
        }
      }
    }
  }
  notifications.push(notification);
  const query3 =
    "select c.*,pr.profilePicName, pr.userName from comments as c left join profile as pr on pr.id = c.profileId where c.id = ?";
  const value3 = [params?.id || commentData.insertId];
  const comments = await executeQuery(query3, value3);

  await UserRewardDetails.create({
    ProfileID: data?.profileId,
    PostID: data.postId,
    ActionType: "C",
  });

  return { notifications, comments };
};

const likeFeedComment = async function (params) {
  const { commentId, profileId, likeCount, actionType } = params;
  const query = `update comments set likeCount = ? where id =?`;
  const query1 = `INSERT INTO commentsLikesDislikes set ?`;
  const values = [likeCount, commentId];
  const data = {
    commentId: commentId,
    profileId: profileId,
    actionType: actionType,
  };
  const values1 = [data];
  const post = await executeQuery(query, values);
  const likeData = await executeQuery(query1, values1);
  const query3 =
    "select c.*,pr.profilePicName, pr.userName from comments as c left join profile as pr on pr.id = c.profileId where c.id = ?";
  const value3 = [commentId];
  const comments = await executeQuery(query3, value3);
  return { comments };
};

const disLikeFeedComment = async function (params) {
  const { commentId, profileId, likeCount } = params;
  if (commentId) {
    const query = `update comments set likeCount = ? where id =?`;
    const query1 = `delete from commentsLikesDislikes where commentId = ? AND profileId = ?`;
    const values = [likeCount, commentId];
    const values1 = [commentId, profileId];
    const post = await executeQuery(query, values);
    const likeData = await executeQuery(query1, values1);
    const query3 =
      "select c.*,pr.profilePicName, pr.userName from comments as c left join profile as pr on pr.id = c.profileId where c.id = ?";
    const value3 = [commentId];
    const comments = await executeQuery(query3, value3);
    return { comments };
  }
};

const deletePost = async function (params) {
  const { id } = params;
  console.log("delete-post-id", id);
  const query = "DELETE FROM posts WHERE id = ?";
  const query1 = "DELETE FROM comments WHERE postId = ?";
  const value = [id];
  const deletePost = await executeQuery(query, value);
  const deleteComments = await executeQuery(query1, value);
  return deletePost;
};
