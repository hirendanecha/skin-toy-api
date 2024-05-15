var db = require("../../config/db.config");
const common = require("../common/common");
const environment = require("../environments/environment");
const { executeQuery } = require("../helpers/utils");

var Community = function (community) {
  this.profileId = community.profileId;
  this.communityName = community.CommunityName;
  this.slug = community.slug;
  this.communityDescription = community.CommunityDescription;
  this.logoImg = community.logoImg;
  this.coverImg = community.coverImg;
  this.isApprove = community.isApprove || "N";
  this.pageType = community?.pageType;
  this.Country = community?.Country;
  this.City = community?.City;
  this.State = community?.State;
  this.Zip = community?.Zip;
  this.County = community?.County;
  this.address = community?.address;
};

Community.findAllCommunity = async function (
  selectedCard,
  selectedCountry,
  selectedState,
  selectedAreas
) {
  console.log(selectedCard, "selectedCard");
  let whereCondition = `c.pageType = 'community' AND c.isApprove = 'Y' ${
    selectedCountry || selectedState
      ? `AND c.Country LIKE '%${selectedCountry}%' AND c.State LIKE '%${selectedState}%'`
      : ""
  }`;
  if (selectedCard) {
    whereCondition += ` AND pe.eId in (${selectedCard})`;
  }
  if (selectedAreas?.length) {
    whereCondition += ` AND pa.aId in (${selectedAreas})`;
  }
  // const searchCount = await executeQuery(
  //   `SELECT count(c.Id) as count FROM community as c WHERE ${whereCondition}`
  // );
  // const searchData = await executeQuery(
  //   `select c.*,count(cm.profileId) as members,c.Country,c.City,c.State,c.Zip,c.County from community as c left join communityMembers as cm on cm.communityId = c.Id left join profile as p on p.id = c.profileId where ${whereCondition} GROUP BY c.Id order by c.creationDate desc limit ? offset ?`,
  //   [limit, offset]
  // );
  // return {
  //   count: searchCount?.[0]?.count || 0,
  //   data: searchData,
  // };
  let query = "";
  query = `select c.* from community as c left join practitioner_emphasis as pe on pe.communityId = c.Id left join practitioner_area as pa on pa.communityId = c.Id where ${whereCondition} GROUP BY c.Id order by c.Id desc;`;
  // const communityList = await executeQuery(query, [id]);
  console.log("query===>", query);
  const communityList = await executeQuery(query);
  // console.log(communityList);
  const localCommunities = [];
  for (const key in communityList) {
    // const query1 =
    //   "select cm.profileId from communityMembers as cm where cm.communityId = ?;";
    const query1 =
      "select pe.eId,eh.name from practitioner_emphasis as pe left join emphasis_healing as eh on eh.eId = pe.eId where pe.communityId =? ";
    const query2 =
      "select pa.aId,ah.name from practitioner_area as pa left join area_healing as ah on ah.aId = pa.aId where pa.communityId =? ";
    if (Object.hasOwnProperty.call(communityList, key)) {
      const community = communityList[key];
      const values1 = [community.Id];
      const emphasis = await executeQuery(query1, values1);
      const areas = await executeQuery(query2, values1);
      community.emphasis = emphasis;
      community.areas = areas;
      localCommunities.push(community);
    }
  }
  return localCommunities;
};

Community.getCommunities = async function (
  limit,
  offset,
  search,
  pageType,
  startDate,
  endDate
) {
  let whereCondition = `c.pageType = '${pageType}' ${
    search ? `AND c.CommunityName LIKE '%${search}%'` : ""
  }`;
  if (startDate && endDate) {
    whereCondition += `AND c.creationDate >= '${startDate}' AND c.creationDate <= '${endDate}'`;
    console.log(whereCondition);
  } else if (startDate) {
    whereCondition += `AND c.creationDate >= '${startDate}'`;
  } else if (endDate) {
    whereCondition += `AND c.creationDate <= '${endDate}'`;
  }
  const searchCount = await executeQuery(
    `SELECT count(c.Id) as count FROM community as c WHERE ${whereCondition}`
  );
  const searchData = await executeQuery(
    `select c.*,count(cm.profileId) as members,c.Country,c.City,c.State,c.Zip,c.County from community as c left join communityMembers as cm on cm.communityId = c.Id left join profile as p on p.id = c.profileId where ${whereCondition} GROUP BY c.Id order by c.creationDate desc limit ? offset ?`,
    [limit, offset]
  );
  return {
    count: searchCount?.[0]?.count || 0,
    data: searchData,
  };
  // db.query(
  //   "select c.*,count(cm.profileId) as members from community as c left join communityMembers as cm on cm.communityId = c.Id where c.isApprove='Y' GROUP BY c.Id order by c.creationDate desc limit ? offset ?",
  //   [limit, offset],
  //   function (err, res) {
  //     if (err) {
  //       result(err, null);
  //     } else {
  //       result(null, res);
  //     }
  //   }
  // );
};

Community.findUnApproveCommunity = async function (
  limit,
  offset,
  search,
  pageType
) {
  const whereCondition = `c.pageType = '${pageType}' AND c.CommunityName LIKE '%${search}%'`;
  const searchCount = await executeQuery(
    `SELECT count(c.Id) as count FROM community as c WHERE ${whereCondition}`
  );
  const searchData = await executeQuery(
    `select c.*,count(cm.profileId) as members from community as c left join communityMembers as cm on cm.communityId = c.Id where c.isApprove='N' and ${whereCondition} GROUP BY c.Id order by c.creationDate desc limit ? offset ?`,
    [limit, offset]
  );
  return {
    count: searchCount?.[0]?.count || 0,
    data: searchData,
  };
};

Community.create = async function (communityData, result) {
  console.log(communityData);
  let communityId = null;
  db.query("INSERT INTO community set ?", communityData, function (err, res) {
    if (err) {
      result(err, null);
    } else {
      result(null, res.insertId);
    }
  });

  // const query = communityData.Id
  //   ? '"update community set ? where Id = ?'
  //   : '"INSERT INTO community set ?';
  // const values = communityData.Id
  //   ? [communityData, communityData.Id]
  //   : { communityData };
  // const community = await executeQuery(query, values);
  // return community;
};
Community.edit = async function (communityData, Id) {
  const query = "update community set ? where Id = ?";
  const values = [communityData, Id];
  const community = await executeQuery(query, values);
  return community;
};

Community.approveCommunity = function (communityId, isApprove, result) {
  db.query(
    "UPDATE community SET isApprove=? where Id=?",
    [isApprove, communityId],
    function (err, res) {
      if (err) {
        console.log(err);
        result(err, null);
      } else {
        console.log(res);
        result(null, res);
      }
    }
  );
};

Community.deleteCommunity = function (id, result) {
  db.query("delete from community where Id=?", id, function (err, res) {
    if (err) {
      result(err, null);
    } else {
      result(null, res);
    }
  });
};

Community.leaveFromCommunity = function (profileId, communityId, result) {
  db.query(
    "delete from communityMembers where profileId=? and communityId=?",
    [profileId, communityId],
    function (err, res) {
      if (err) {
        result(err, null);
      } else {
        result(null, res);
      }
    }
  );
};

Community.findCommunityById = async function (id) {
  const query1 =
    "select c.*,p.userName,count(cm.profileId) as members from community as c left join profile as p on p.id = c.profileId left join communityMembers as cm on cm.communityId = c.Id where c.Id=?;";
  const query2 =
    "select cm.*,p.userName,p.profilePicName,p.zip,p.country,p.state,p.city,u.email,p.userId from communityMembers as cm left join profile as p on p.id = cm.profileId left join users as u on u.id = p.userId  where cm.communityId = ?;";
  const values = [id];
  const community = await executeQuery(query1, values);
  const members = await executeQuery(query2, values);
  community.map((e) => {
    e.memberList = members;
    return e;
  });
  return community;
};

Community.findCommunityBySlug = async function (slug) {
  const communityQuery =
    "select c.*,p.userName, count(cm.profileId) as members from community as c left join profile as p on p.id = c.profileId left join communityMembers as cm on cm.communityId = c.Id where c.slug=?";
  const communities = await executeQuery(communityQuery, [slug]);
  const community = communities?.[0] || {};

  if (community?.Id) {
    const getMembersQuery =
      "select cm.*,p.userName, p.profilePicName from communityMembers as cm left join profile as p on p.id = cm.profileId where cm.communityId = ?;";
    const members = await executeQuery(getMembersQuery, [community?.Id]);
    community["memberList"] = members;
  }

  return community;
};

Community.search = async function (searchText, limit, offset) {
  // const { searchText } = query;
  if (searchText) {
    const query = `select * from community WHERE CommunityName LIKE ? limit ? offset ?`;
    const values = [`%${searchText}%`, limit, offset];
    const searchData = await executeQuery(query, values);
    return searchData;
  } else {
    // const query = `select *  from ${type}`;
    // const searchData = await executeQuery(query);
    // return searchData;
    return { error: "data not found" };
  }
  // } else {
  //   return { error: "error" };
  // }
};

Community.joinCommunity = async function (data, result) {
  console.log(data);
  db.query("insert into communityMembers set ?", data, function (err, res) {
    if (err) {
      result(err, null);
    } else {
      result(null, res.insertId);
    }
  });
};

Community.createCommunityAdmin = async function (isAdmin, id, result) {
  db.query(
    "update communityMembers set isAdmin=? where Id =?",
    [isAdmin, id],
    function (err, res) {
      if (err) {
        result(err, null);
      } else {
        result(null, res);
      }
    }
  );
};

Community.createCommunityAdminByMA = async function (data) {
  const query =
    "select * from communityMembers where profileId = ? and communityId= ?";
  const values = [data.profileId, data.communityId];
  const member = await executeQuery(query, values);
  if (member.length) {
    const query =
      "update communityMembers set isAdmin=? where profileId =? and communityId = ?";
    const values = [data.isAdmin, data.profileId, data.communityId];
    const member = await executeQuery(query, values);
  } else {
    const query = "insert into communityMembers set ?";
    const values = [data];
    const member = await executeQuery(query, values);
  }
};

Community.getLocalCommunities = async function (id) {
  const query =
    // "select * from community where profileId = ? and isApprove = 'Y' order by creationDate desc limit 3";
    `SELECT c.* FROM community AS c LEFT JOIN communityMembers AS cm ON cm.communityId = c.Id WHERE c.isApprove = 'Y' AND cm.profileId = ? GROUP BY c.Id limit 3`;
  const communities = await executeQuery(query, [id]);
  return communities;
};

Community.getCommunity = async function (id, pageType) {
  console.log("get==>", id, pageType);
  const query1 = "select communityId from communityMembers where profileId = ?";
  const communityId = await executeQuery(query1, [id]);
  const ids = communityId.map((ele) => Number(ele.communityId)).join(",");
  let query = "";
  // if (ids) {
  //   query = `select c.*,count(cm.profileId) as members from community as c left join communityMembers as cm on cm.communityId = c.Id where c.isApprove = 'Y' AND c.pageType = '${pageType}' AND cm.profileId != ? group by c.Id order by c.Id desc;`;
  // } else {
  //   query = `select c.*,count(cm.profileId) as members from community as c left join communityMembers as cm on cm.communityId = c.Id where c.isApprove = 'Y' AND c.pageType = '${pageType}' AND cm.profileId != ? group by c.Id order by c.Id desc;`;
  // }
  query = `select c.* from community as c where c.isApprove = 'Y' AND c.pageType = '${pageType}' group by c.Id order by c.Id desc;`;
  // const communityList = await executeQuery(query, [id]);
  const communityList = await executeQuery(query);
  console.log(communityList);
  const localCommunities = [];
  for (const key in communityList) {
    const query1 =
      "select pe.eId,eh.name from practitioner_emphasis as pe left join emphasis_healing as eh on eh.eId = pe.eId where pe.communityId =? ";
    const query2 =
      "select pa.aId,ah.name from practitioner_area as pa left join area_healing as ah on ah.aId = pa.aId where pa.communityId =? ";
    const query3 =
      "select cm.profileId from communityMembers as cm where cm.communityId = ?;";
    if (Object.hasOwnProperty.call(communityList, key)) {
      const community = communityList[key];
      const values1 = [community.Id];
      const emphasis = await executeQuery(query1, values1);
      const areas = await executeQuery(query2, values1);
      const memberList = [];
      const members = await executeQuery(query3, values1);
      members.map((e) => {
        memberList?.push(e.profileId);
      });
      community.memberList = memberList;
      community.members = members.length;
      community.emphasis = emphasis;
      community.areas = areas;
      localCommunities.push(community);
    }
  }
  return localCommunities;
};

Community.getCommunityByUserId = async function (id, pageType) {
  const query =
    "select c.*,count(cm.profileId) as members from community as c left join communityMembers as cm on cm.communityId = c.Id where c.pageType = ? AND c.profileId =? group by c.Id;";
  const values = [pageType, id];
  const communityList = await executeQuery(query, values);
  console.log(communityList);
  return communityList;
};

Community.getJoinedCommunityByProfileId = async function (id, pageType) {
  const query = `SELECT 
  c.*
  FROM
  community AS c
      LEFT JOIN
  communityMembers AS cm ON cm.communityId = c.Id and cm.profileId != c.profileId
  WHERE
  c.isApprove = 'Y'
  AND c.pageType = '${pageType}'
      AND cm.profileId = ?
  GROUP BY c.Id`;
  const values = [id];
  const communityList = await executeQuery(query, values);
  const joinedCommunityList = [];
  for (const key in communityList) {
    const query1 =
      "select count(cm.profileId) as members from communityMembers as cm where communityId = ?";
    if (Object.hasOwnProperty.call(communityList, key)) {
      const community = communityList[key];
      const values1 = [community.Id];
      const members = await executeQuery(query1, values1);
      community.members = members[0].members;
      console.log(community);
      joinedCommunityList.push(community);
    }
  }
  return joinedCommunityList;
};

Community.addEmphasis = async function (communityId, data) {
  if (data) {
    const newData = data
      .map((element) => `(${communityId}, ${element})`)
      .join(", ");
    const query = `insert into practitioner_emphasis (communityId,eId) values ${newData}`;
    const emphasis = await executeQuery(query);
    return emphasis;
  }
};

Community.addAreas = async function (communityId, data) {
  if (data) {
    const newData = data
      .map((element) => `(${communityId}, ${element})`)
      .join(", ");
    const query = `insert into practitioner_area (communityId,aId) values ${newData}`;
    const areas = await executeQuery(query);
    return areas;
  }
};

Community.getEmphasisAndArea = async function () {
  const query = "select * from emphasis_healing";
  const emphasis = await executeQuery(query);
  const query1 = "select * from area_healing";
  const area = await executeQuery(query1);
  return { emphasis, area };
};

Community.CreateAdvertizementLink = async function (communityLinkData, result) {
  console.log(communityLinkData);
  db.query(
    "INSERT INTO advertizement_Link set ?",
    communityLinkData,
    function (err, res) {
      if (err) {
        result(err, null);
      } else {
        result(null, res.insertId);
      }
    }
  );
};

Community.editAdvertizeMentLink = async function (communityLinkData) {
  const query = "update advertizement_Link set ? where communityId =?";
  const values = [communityLinkData, communityLinkData.communityId];
  const updateLink = await executeQuery(query, values);
  return updateLink;
};

Community.getLink = function (id, result) {
  db.query(
    "select * from advertizement_Link where communityId=?",
    id,
    function (err, res) {
      if (err) {
        result(err, null);
      } else {
        result(null, res);
      }
    }
  );
};

module.exports = Community;
