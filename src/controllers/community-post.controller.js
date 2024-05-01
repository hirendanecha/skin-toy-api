const CommunityPost = require("../models/community-post.model");
const utils = require("../helpers/utils");
const og = require("open-graph");
const { getPagination, getCount, getPaginationData } = require("../helpers/fn");

exports.findAll = async function (req, res) {
  const { page, size, search } = req.query;
  const { limit, offset } = getPagination(page, size);
  const searchData = await CommunityPost.findAll(limit, offset, search);
  return res.send(
    getPaginationData(
      { count: searchData.count, docs: searchData.data },
      page,
      limit
    )
  );
};

exports.getCommunityPostById = function (req, res) {
  console.log(req.params.id);
  CommunityPost.getCommunityPostById(req.params.id, function (err, post) {
    if (err) return utils.send500(res, err);
    res.send(post);
  });
};

exports.createPost = function (req, res) {
  if (Object.keys(req.body).length === 0) {
    res.status(400).send({ error: true, message: "Error in application" });
  } else {
    const postData = new Post(req.body);
    console.log(postData);
    CommunityPost.create(postData, function (err, post) {
      if (err) {
        return utils.send500(res, err);
      } else {
        return res.json({
          error: false,
          mesage: "Post created",
          data: post,
        });
      }
    });
  }
};

exports.getMeta = function (req, res) {
  const url = req.body.url;
  og(url, function (err, meta) {
    if (err) {
      return utils.send500(res, err);
    } else {
      return res.json({
        error: false,
        mesage: "Post created",
        data: meta.image,
      });
    }
  });
};

exports.deletePost = function (req, res) {
  if (req.params.id) {
    CommunityPost.deletePost(req.params.id, function (err, result) {
      if (err) {
        return utils.send500(res, err);
      } else {
       return res.send({
          error: false,
          mesage: "Post deleted sucessfully",
        });
      }
    });
  } else {
    return utils.send404(res, err);
  }
};

exports.getPostByPostId = function (req, res) {
  console.log(req.params.id);
  CommunityPost.getPostByPostId(req.params.id, function (err, post) {
    if (err) return utils.send500(res, err);
    res.send(post);
  });
};
