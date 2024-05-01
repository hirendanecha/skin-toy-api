const Community = require("../models/community.model");
const User = require("../models/user.model");
const utils = require("../helpers/utils");
const { getPagination, getCount, getPaginationData } = require("../helpers/fn");

// Admin Api //
exports.findAllCommunity = async function (req, res) {
  const { selectedCard, selectedCountry, selectedState, selectedAreas } = req.body;
  console.log(req.body);
  const searchData = await Community.findAllCommunity(
    selectedCard,
    selectedCountry,
    selectedState,
    selectedAreas
  );
  return res.send(searchData);
};
exports.getCommunities = async function (req, res) {
  const { page, size, search, pageType, startDate, endDate } = req.body;
  const { limit, offset } = getPagination(page, size);
  const searchData = await Community.getCommunities(
    limit,
    offset,
    search,
    pageType,
    startDate,
    endDate
  );
  return res.send(
    getPaginationData(
      { count: searchData.count, docs: searchData.data },
      page,
      limit
    )
  );
};
exports.findUnApproveCommunity = async function (req, res) {
  const { page, size, search, pageType } = req.query;
  const { limit, offset } = getPagination(page, size);
  const searchData = await Community.findUnApproveCommunity(
    limit,
    offset,
    search,
    pageType
  );
  return res.send(
    getPaginationData(
      { count: searchData.count, docs: searchData.data },
      page,
      limit
    )
  );
};

exports.createCommunity = async function (req, res) {
  if (Object.keys(req.body).length === 0) {
    res.status(400).send({ error: true, message: "Error in application" });
  } else {
    const communityData = new Community(req.body);
    console.log(communityData);
    Community.create(communityData, async function (err, community) {
      if (err) {
        return utils.send500(res, err);
      } else {
        if (community) {
          const emphasisData = req.body.emphasis;
          const areasData = req.body.areas;
          const emphasis = await Community.addEmphasis(community, emphasisData);
          const areas = await Community.addAreas(community, areasData);
          console.log(emphasis, areas);
        }
        return res.json({
          error: false,
          message: "Your community will be approve by admin",
          data: community,
        });
      }
    });
  }
};
exports.editCommunity = async function name(req, res) {
  const Id = req.params.id;
  const communityData = new Community(req.body);
  console.log(communityData, Id);
  const community = await Community.edit(communityData, Id);
  if (community) {
    return res.json({
      error: false,
      message: "update community successfully",
    });
  } else {
    res.status(500).send({
      error: true,
      message: "something went wrong, please try again!",
    });
  }
};

exports.approveCommunity = function (req, res) {
  console.log(req.params.id, req.query.IsApprove);
  const communityId = req.params.id;
  const isApprove = req.query.IsApprove;
  const profileId = req.query.profileId;
  Community.approveCommunity(
    communityId,
    isApprove,
    async function (err, result) {
      if (err) {
        return utils.send500(err, res);
      } else {
        await utils.communityApproveEmail(profileId, isApprove);
        console.log(result);
        if (isApprove === "Y") {
          res.json({
            error: false,
            message: "Community approved successfully",
          });
        } else {
          res.json({
            error: false,
            message: "Community unapproved successfully",
          });
        }
      }
    }
  );
};

exports.changeAccountType = function (req, res) {
  if (req.params.id) {
    const userId = req.params.id;
    User.changeAccountType(userId, req.query.type, function (err, result) {
      if (err) {
        return utils.send500(res, err);
      } else {
        return res.send({
          error: false,
          message: "Account type change successfully",
        });
      }
    });
  } else {
    res.status(400).send({ error: true, message: "Error in application" });
  }
};

exports.deleteCommunity = function (req, res) {
  if (req.params.id) {
    Community.deleteCommunity(req.params.id, function (err, result) {
      if (err) return utils.send500(res, err);
      res.json({
        error: false,
        message: "deleted successfully",
      });
    });
  }
};

exports.leaveFromCommunity = function (req, res) {
  const { profileId, communityId } = req.query;
  Community.leaveFromCommunity(profileId, communityId, function (err, result) {
    if (err) return utils.send500(res, err);
    res.json({
      error: false,
      message: "removed successfully",
    });
  });
};

exports.findCommunityById = async function (req, res) {
  if (req.params.id) {
    const community = await Community.findCommunityById(req.params.id);
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

exports.findCommunityBySlug = async function (req, res) {
  if (req.params.slug) {
    const community = await Community.findCommunityBySlug(req.params.slug);
    if (community) {
      res.send(community);
    } else {
      res.status(400).send({
        error: true,
        message: "Community not found",
      });
    }
  } else {
    res.status(400).send({
      error: true,
      message: "Pass valid params",
    });
  }
};

exports.search = async function (req, res) {
  const { page, size, searchText } = req.query;
  const { limit, offset } = getPagination(page, size);
  const count = await getCount("users");
  const data = await Community.search(searchText, limit, offset);
  return res.send(getPaginationData({ count, docs: data }, page, limit));
};

exports.joinCommunity = function (req, res) {
  const data = { ...req.body };
  Community.joinCommunity(data, function (err, result) {
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

exports.createCommunityAdmin = function (req, res) {
  const { isAdmin, id } = req.body;
  Community.createCommunityAdmin(isAdmin, id, function (err, result) {
    if (err) {
      return utils.send500(res, err);
    } else {
      if (isAdmin === "Y") {
        return res.json({
          error: false,
          message: "Member promoted successfully.",
        });
      } else {
        return res.json({
          error: false,
          message: "Admin demoted successfully.",
        });
      }
    }
  });
};

exports.createCommunityAdminByMA = function (req, res) {
  const data = { ...req.body };
  console.log(data);
  const member = Community.createCommunityAdminByMA(data);
  if (member) {
    return res.json({
      error: false,
      message: "Member promoted successfully.",
    });
  }
};

// Client Api //

exports.getLocalCommunities = async function (req, res) {
  const { id } = req.params;
  const communityList = await Community.getLocalCommunities(id);
  if (communityList) {
    res.send(communityList);
  }
};

exports.getCommunity = async function (req, res) {
  const userId = req.query.id;
  const { pageType } = req.query;
  console.log(pageType);
  const communityList = await Community.getCommunity(userId, pageType);
  if (!communityList) {
    return utils.send500(err, res);
  } else {
    res.send({
      error: false,
      data: communityList,
    });
  }
};

exports.getCommunityByUserId = async function (req, res) {
  const userId = req.params.id;
  const { pageType } = req.query;
  console.log(pageType);
  const communityList = await Community.getCommunityByUserId(userId, pageType);
  if (!communityList) {
    return utils.send500(err, res);
  } else {
    res.send({
      error: false,
      data: communityList,
    });
  }
};
exports.getJoinedCommunityByProfileId = async function (req, res) {
  const { id } = req.params;
  const { pageType } = req.query;
  const communityList = await Community.getJoinedCommunityByProfileId(
    id,
    pageType
  );
  if (!communityList) {
    return utils.send500(err, res);
  } else {
    res.send({
      error: false,
      data: communityList,
    });
  }
};

exports.getEmphasisAndArea = async function (req, res) {
  const data = await Community.getEmphasisAndArea();
  console.log(data);
  if (data) {
    res.json(data);
  } else {
    res.status(404).send({ message: "not found!" });
  }
};


exports.CreateAdvertizementLink = async function (req, res) {
  if (Object.keys(req.body).length === 0) {
    res.status(400).send({ error: true, message: "Error in application" });
  } else {
    const communityLinkData = req.body;
    console.log(communityLinkData);
    Community.CreateAdvertizementLink(
      communityLinkData,
      function (err, community) {
        if (err) {
          return utils.send500(res, err);
        } else {
          return res.json({
            error: false,
            message: "Your community will be approve by admin",
            data: community,
          });
        }
      }
    );
  }
};

exports.editAdvertizeMentLink = async function (req, res) {
  if (Object.keys(req.body).length === 0) {
    res.status(400).send({ error: true, message: "Error in application" });
  } else {
    const communityLinkData = req.body;
    console.log(communityLinkData);
    const data = await Community.editAdvertizeMentLink(communityLinkData);
    if (data) {
      res.json({
        error: false,
        message: "link update successfully",
      });
    } else {
      res.status(500).json({
        error: true,
        message: "something went wrong!!",
      });
    }
  }
};
exports.getLink = function (req, res) {
  if (req.params.id) {
    Community.getLink(req.params.id, function (err, data) {
      if (err) return utils.send500(res, err);
      res.json({
        error: false,
        data: data,
      });
    });
  }
};
