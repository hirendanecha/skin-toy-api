const featuredChannels = require("../models/featuredChannels.model");
const utils = require("../helpers/utils");
const { getPagination, getPaginationData } = require("../helpers/fn");

exports.getChannels = async function (req, res) {
  const data = await featuredChannels.getChannels();
  if (data) {
    res.send({ data });
  } else {
    utils.send404(res, (err = { message: "data not found" }));
  }
};

exports.getAllChannels = async (req, res) => {
  const { page, size, search, startDate, endDate } = req.body;
  const { limit, offset } = getPagination(page, size);
  const searchCountData = await featuredChannels.getAllChannels(
    limit,
    offset,
    search,
    startDate,
    endDate
  );
  return res.send(
    getPaginationData(
      { count: searchCountData.count, docs: searchCountData.data },
      page,
      limit
    )
  );
};

exports.searchAllData = async (req, res) => {
  const { search } = req.body;
  const searchData = await featuredChannels.searchAllData(search);
  return res.send(searchData);
};

exports.findChannelById = async function (req, res) {
  if (req.params.id) {
    const community = await featuredChannels.findChannelById(req.params.id);
    if (community) {
      res.send(community);
    } else {
      res.status(400).send({
        error: true,
        message: "Community not found",
      });
    }
  }
};

exports.getUsersByUsername = async function (req, res) {
  const { searchText } = req.query;
  const data = await featuredChannels.getUsersByUsername(searchText);
  return res.send({
    error: false,
    data: data,
  });
};

exports.getChannelById = async function (req, res) {
  const name = req.params.name;
  console.log(name);
  const data = await featuredChannels.getChannelById(name);
  if (data) {
    res.send({ data });
  } else {
    utils.send404(res, (err = { message: "data not found" }));
  }
};
exports.getChannelByUserId = async function (req, res) {
  const id = req.params.id;
  console.log(id);
  const data = await featuredChannels.getChannelByUserId(id);
  if (data) {
    res.send(data);
  } else {
    utils.send404(res, (err = { message: "data not found" }));
  }
};

exports.CreateSubAdmin = function (req, res) {
  const data = { ...req.body };
  featuredChannels.CreateSubAdmin(data, function (err, result) {
    if (err) {
      return utils.send500(res, err);
    } else {
      return res.json({
        error: false,
        data: result,
      });
    }
  });
};

exports.getPostDetails = async function (req, res) {
  const { id } = req.params;
  console.log(id);
  const data = await featuredChannels.getPostDetails(id);
  if (data) {
    res.send(data);
  } else {
    utils.send404(res, (err = { message: "data not found" }));
  }
};

exports.channelsApprove = async function (req, res) {
  const { id, feature } = req.query;
  console.log(id, feature);
  const channel = await featuredChannels.approveChannels(id, feature);
  console.log(channel);
  if (feature === "Y") {
    res.send({
      error: false,
      message: "Channel activate successfully",
    });
  } else {
    res.send({
      error: false,
      message: "Channel de-activate successfully",
    });
  }
};

exports.createChannel = async function (req, res) {
  const data = new featuredChannels({ ...req.body });
  data.feature = data.feature === true ? "Y" : "N";
  if (data) {
    const newChannel = await featuredChannels.createChannel(data);
    console.log(newChannel);
    if (newChannel.insertId) {
      res.send({
        error: false,
        data: newChannel.insertId,
      });
    } else {
      utils.send404(res, (err = { message: "channel already exists!" }));
    }
  } else {
    utils.send404(res, (err = { message: "data not found" }));
  }
};

exports.getChannelVideos = async function (req, res) {
  const { id, page, size } = req?.body;
  const { limit, offset } = getPagination(page, size);
  const posts = await featuredChannels.getChannelVideos(id, limit, offset);
  if (posts.data) {
    res.send(
      getPaginationData({ count: posts.count, docs: posts.data }, page, limit)
    );
  } else {
    utils.send500(res, (err = { message: "data not found" }));
  }
};

exports.getVideos = async function (req, res) {
  const { id, page, size } = req?.body;
  const { limit, offset } = getPagination(page, size);
  const posts = await featuredChannels.getVideos(id, limit, offset);
  if (posts.data) {
    res.send(
      getPaginationData({ count: posts.count, docs: posts.data }, page, limit)
    );
  } else {
    utils.send500(res, (err = { message: "data not found" }));
  }
};
exports.deleteChannel = async function (req, res) {
  const id = req.params.id;
  const data = await featuredChannels.deleteChannel(id);
  if (data) {
    res.send({ message: "channel deleted successfully" });
  }
};

exports.updateChannleFeature = function (req, res) {
  console.log(req.params.id, req.query.feature);
  const id = req.params.id;
  const feature = req.query.feature;
  featuredChannels.updateChannleFeature(
    id,
    feature,
    async function (err, result) {
      if (err) {
        return utils.send500(err, null);
      } else {
        console.log(result);
        if (feature === "Y") {
          res.json({
            error: false,
            message: "Channel add in feature successfully",
          });
        } else {
          res.json({
            error: false,
            message: "Channel removed from feature successfully",
          });
        }
      }
    }
  );
};

exports.removeFormChannel = function (req, res) {
  const { profileId, channelId } = req.query;
  featuredChannels.removeFormChannel(
    profileId,
    channelId,
    function (err, result) {
      if (err) return utils.send500(res, err);
      res.json({
        error: false,
        message: "removed successfully",
      });
    }
  );
};
