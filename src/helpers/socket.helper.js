let logger = console;
const socket = {};
const socketService = require("../service/socket-service");
const environment = require("../environments/environment");
const chatService = require("../service/chat-service");
const jwt = require("jsonwebtoken");

socket.config = (server) => {
  const io = require("socket.io")(server, {
    transports: ["websocket", "polling"],
    cors: {
      origin: "*",
    },
  });
  socket.io = io;
  let onlineUsers = [];

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.Authorization.split(" ")[1];
      if (!token) {
        const err = new Error("Unauthorized Access");
        return next(err);
      }
      let decoded = jwt.decode(token);
      jwt.verify(token, environment.JWT_SECRET_KEY, async (err, user) => {
        if (err) {
          const err = new Error("Invalid or Expired Token");
          return next(err);
        }
        socket.user = decoded.user;
        const chatData = await chatService.getRoomsIds(socket.user.id);
        if (chatData) {
          for (const roomId of chatData?.roomsIds) {
            const chat = roomId;
            socket.join(`${chat.roomId}`);
          }
          for (const groupId of chatData?.groupsIds) {
            const chat = groupId;
            socket.join(`${chat.groupId}`);
          }
        }
        socket.join(`${socket.user?.id}`);
        next();
      });
    } catch (error) {
      const err = new Error("Invalid or Expired Token");
      return next(err);
    }
  });

  io.sockets.on("connection", (socket) => {
    let address = socket.request.connection.remoteAddress;

    logger.info(`New Connection`, {
      address,
      id: socket.id,
    });
    socket.on("leave", (params) => {
      logger.info("leaved", {
        ...params,
        address,
        id: socket.id,
        method: "leave",
      });
      socket.leave(params.room);
    });

    socket.on("join", async (params) => {
      socket.join(params.room, {
        ...params,
      });
      logger.info("join", {
        ...params,
        address,
        id: socket.id,
        method: "join",
      });
    });

    socket.on("online-users", async (cb) => {
      logger.info("online user", {
        id: socket.id,
        method: "online",
        type: typeof cb,
      });
      const newUserId = socket.user.id;
      if (!onlineUsers.some((user) => user.userId === newUserId)) {
        const status = await chatService.userStatus(newUserId);
        console.log("userStatus", status);
        if (status) {
          onlineUsers.push({
            userId: newUserId,
            socketId: socket.id,
            status: status,
          });
        } else {
          onlineUsers.push({ userId: newUserId, socketId: socket.id });
        }
      }
      io.emit("get-users", onlineUsers);
      // return cb(onlineUsers);
    });

    socket.on("offline", () => {
      // remove user from active users
      onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);
      // send all online users to all users
      io.emit("get-users", onlineUsers);
    });

    socket.on("disconnect", () => {
      logger.info("disconnected", {
        id: socket.id,
        method: "disconnect",
      });
    });

    socket.on("rooms", (params, cb) => {
      logger.info("Rooms", {
        id: socket.id,
        method: "rooms",
        type: typeof cb,
        params: params,
      });

      if (typeof cb === "function")
        cb({
          rooms: ["DSDsds"],
        });
    });

    // socket for post //
    socket.on("get-new-post", async (params) => {
      console.log(params);

      logger.info("New post found", {
        method: "New post found",
        params: params,
      });
      const data = await socketService.getPost(params);
      if (data) {
        socket.emit("new-post", data);
      }
    });

    socket.on("create-new-post", async (params, cb) => {
      logger.info("Create new post", {
        method: "Create new post",
        params: params,
      });
      try {
        const data = await socketService.createPost(params);
        if (data?.posts) {
          io.emit("new-post-added", data?.posts);

          if (data?.notifications) {
            for (const key in data?.notifications) {
              if (Object.hasOwnProperty.call(data?.notifications, key)) {
                const notification = data?.notifications[key];

                io.to(`${notification.notificationToProfileId}`).emit(
                  "notification",
                  notification
                );
              }
            }
          }

          const socketData = await socketService.getPost(params);
          if (typeof cb === "function") cb(socketData);
          socket.broadcast.emit("new-post", socketData);
        }
      } catch (error) {
        console.log(error);
      }
    });

    // socket for community //
    socket.on("create-new-community", async (params) => {
      logger.info("Create new community", {
        method: "Create new community",
        params: params,
      });
      const community = await socketService.createCommunity(params);
      if (community) {
        socket.emit("create-new-community", community);
        const communityList = await socketService.getUnApproveCommunity(params);
        socket.broadcast.emit("get-unApprove-community", communityList);
      }
    });

    socket.on("create-community-post", async (params) => {
      logger.info("Create community post", {
        method: "Create community post",
        params: params,
      });
      const post = await socketService.createCommunityPost(params);
      console.log(post);
      if (post) {
        socket.emit("create-community-post", post);
        const data = await socketService.getCommunityPost(params);
        if (data) {
          socket.broadcast.emit("community-post", data);
        }
      }
      // socket.broadcast.emit("get-community-post", { ...params });
    });

    socket.on("get-community-post", async (params) => {
      console.log(params);

      logger.info("New post found", {
        method: "New post found",
        params: params,
      });
      const data = await socketService.getCommunityPost(params);
      if (data) {
        console.log("posts", data);
        socket.emit("community-post", data);
      }
    });

    socket.on("get-new-community", async (params) => {
      console.log(params);

      logger.info("New community found", {
        method: "New community found",
        params: params,
      });
      console.log(params);
      const communityList = await socketService.getCommunity(params);
      if (communityList) {
        socket.emit("new-community", communityList);
      }
    });

    //socket for admin //
    socket.on("get-unApprove-community", async (params) => {
      console.log(params);

      logger.info("New community found", {
        method: "New community found",
        params: params,
      });
      const communityList = await socketService.getUnApproveCommunity(params);
      if (communityList) {
        console.log(communityList);
        socket.emit("get-unApprove-community", communityList);
      }
    });

    socket.on("get-Approve-community", async (params) => {
      console.log(params);

      logger.info("New community found", {
        method: "New community found",
        params: params,
      });
      const communityList = await socketService.getApproveCommunity(params);
      if (communityList) {
        console.log(communityList);
        socket.emit("get-Approve-community", communityList);
      }
    });

    socket.on("likeOrDislike", async (params) => {
      logger.info("like", {
        method: "Like on post",
        params: params,
      });
      if (params.actionType) {
        if (params.postId) {
          const data = await socketService.likeFeedPost(params);
          io.emit("likeOrDislike", data.posts);
          const notification = await socketService.createNotification({
            notificationToProfileId: params.toProfileId,
            postId: params.postId,
            notificationByProfileId: params.profileId,
            actionType: params.actionType,
          });
          console.log(notification);
          // notification - emit - to user
          io.to(`${notification.notificationToProfileId}`).emit(
            "notification",
            notification
          );
          // } else if (params.communityPostId) {
          //   const data = await socketService.likeFeedPost(params);
          //   socket.broadcast.emit("community-post", data);
          //   const notification = await socketService.createNotification({
          //     notificationToProfileId: params.toProfileId,
          //     postId: params.communityPostId,
          //     notificationByProfileId: params.profileId,
          //     actionType: params.actionType,
          //   });
          //   // notification - emit - to user
          //   io.to(`${notification.notificationToProfileId}`).emit(
          //     "notification",
          //     notification
          //   );
        }
      } else {
        if (params.postId) {
          const data = await socketService.disLikeFeedPost(params);
          // socket.broadcast.emit("new-post", data);
          io.emit("likeOrDislike", data.posts);
        }
        // else if (params.communityPostId) {
        //   const data = await socketService.disLikeFeedPost(params);
        //   socket.broadcast.emit("community-post", data);
        // }
      }
    });

    socket.on("send-notification", (params) => {
      console.log(params);

      logger.info("likeOrDislikeNotify", {
        method: "User like on post",
        params: params,
      });
    });

    socket.on("comments-on-post", async (params) => {
      console.log(params);
      const data = await socketService.createComments(params);
      if (data.comments) {
        console.log("comments-on-post====>", data?.comments);
        io.emit("comments-on-post", data?.comments);
      }
      if (data?.notifications) {
        for (const key in data?.notifications) {
          if (Object.hasOwnProperty.call(data?.notifications, key)) {
            const notification = data?.notifications[key];
            io.to(`${notification.notificationToProfileId}`).emit(
              "notification",
              notification
            );
          }
        }
      }
      logger.info("comments on post", {
        method: "User comment on post",
        params: params,
      });
    });

    socket.on("likeOrDislikeComments", async (params) => {
      logger.info("like", {
        method: "Like on post",
        params: params,
      });
      if (params.actionType) {
        const data = await socketService.likeFeedComment(params);
        console.log(data.comments);
        socket.broadcast.emit("likeOrDislikeComments", data.comments);
        const notification = await socketService.createNotification({
          notificationToProfileId: params.toProfileId,
          postId: params.postId,
          commentId: params.commentId,
          notificationByProfileId: params.profileId,
          actionType: params.actionType,
        });
        console.log(notification);
        // notification - emit - to user
        io.to(`${notification.notificationToProfileId}`).emit(
          "notification",
          notification
        );
      } else {
        const data = await socketService.disLikeFeedComment(params);
        socket.broadcast.emit("likeOrDislikeComments", data.comments);
      }
    });

    socket.on("deletePost", async (params) => {
      logger.info("like", {
        method: "delete post",
        params: params,
      });
      if (params.id) {
        const data = await socketService.deletePost(params);
        io.emit("deletePost", data);
      }
    });

    socket.on("isReadNotification", async (params) => {
      logger.info("like", {
        method: "read notification",
        params: params,
      });
      try {
        if (params.profileId) {
          params["isRead"] = "Y";
          io.to(`${params.profileId}`).emit("isReadNotification_ack", params);
        }
      } catch (error) {
        return error;
      }
    });

    // Message Socket //
    socket.on("join-chat-room", async (params) => {
      socket.join(params.room, {
        ...params,
      });
      logger.info("join", {
        ...params,
        address,
        id: socket.id,
        method: "join",
      });
    });

    socket.on("get-chat-list", async (params, cb) => {
      // logger.info("get-chat", {
      //   ...params,
      //   address,
      //   id: socket.id,
      //   method: "get-chat",
      // });
      try {
        if (params) {
          const chatList = await chatService.getChatList(params);
          // for (const key in chatList) {
          //   if (Object.hasOwnProperty.call(chatList, key)) {
          //     const chat = chatList[key];
          //     socket.join(`${chat.roomId}`);
          //     console.log(socket.id);
          //   }
          // }
          if (cb) {
            // socket.emit("chat-list", chatList);
            return cb(chatList);
          }
        }
      } catch (error) {
        cb(error);
      }
    });

    socket.on("check-room", async (params, cb) => {
      logger.info("join", {
        ...params,
        address,
        id: socket.id,
        method: "join",
      });
      try {
        if (params) {
          const room = await chatService.checkRoomCreated(params);
          if (cb) {
            // socket.emit("chat-list", chatList);
            return cb(room);
          } else {
          }
        }
      } catch (error) {
        cb(error);
      }
    });

    socket.on("create-room", async (params, cb) => {
      logger.info("join", {
        ...params,
        address,
        id: socket.id,
        method: "join",
      });
      try {
        if (params) {
          const data = await chatService.createChatRoom(params);
          if (data?.room) {
            // io.to(`${params.profileId2}`).emit("new-room", data.id);
            if (data?.notification) {
              if (data?.notification) {
                io.to(`${data.notification?.notificationToProfileId}`).emit(
                  "notification",
                  data?.notification
                );
              }
            }
            return cb({ room: data.room });
          } else {
            return cb({ message: "Room already created" });
          }
        }
      } catch (error) {
        cd(error);
      }
    });

    socket.on("send-message", async (params, cb) => {
      logger.info("send-message", {
        ...params,
        address,
        id: socket.id,
        method: "send-message",
      });
      try {
        if (params) {
          const data = await chatService.sendMessage(params);
          console.log("new-message", data);
          if (data.newMessage) {
            if (params?.groupId) {
              io.to(`${params.groupId}`).emit("new-message", data.newMessage);
              if (data?.notification) {
                if (data?.notification) {
                  io.to(`${params.groupId}`).emit(
                    "notification",
                    data?.notification
                  );
                }
              }
            } else {
              console.log("in=========>");
              io.to(`${params.roomId}`).emit("new-message", data.newMessage);
              if (data?.notification) {
                io.to(`${params?.roomId}`).emit(
                  "notification",
                  data?.notification
                );
              }
            }
            // if (data?.notifications) {
            //   for (const key in data?.notifications) {
            //     if (Object.hasOwnProperty.call(data?.notifications, key)) {
            //       const notification = data?.notifications[key];
            //       io.to(`${notification.notificationToProfileId}`).emit(
            //         "notification",
            //         notification
            //       );
            //     }
            //   }
            // }
            return cb(data.newMessage);
          }
        }
      } catch (error) {
        cb(error);
      }
    });

    socket.on("read-message", async (params, cb) => {
      logger.info("read-message", {
        ...params,
        address,
        id: socket.id,
        method: "read-message",
      });
      try {
        if (params) {
          const data = await chatService.readMessage(params);
          if (params?.profileId) {
            io.to(`${params?.profileId}`).emit("seen-room-message", data);
          }
          if (data) {
            return cb(data);
          }
        }
      } catch (error) {
        cb(error);
      }
    });

    socket.on("read-group-message", async (params, cb) => {
      logger.info("read-group-message", {
        ...params,
        address,
        id: socket.id,
        method: "read-group-message",
      });
      try {
        if (params) {
          const data = await chatService.readGroupMessage(params);
          if (params?.groupId) {
            console.log("read-message-user", data);
            io.to(`${params?.groupId}`).emit("read-message-user", data);
          }
          if (data) {
            return cb(data);
          }
        }
      } catch (error) {
        cb(error);
      }
    });

    socket.on("accept-room", async (params, cb) => {
      logger.info("accept-room", {
        ...params,
        address,
        id: socket.id,
        method: "accept-room",
      });
      try {
        if (params) {
          const data = await chatService.acceptRoom(params);
          console.log(data);
          if (data) {
            io.to(`${data?.notification?.notificationToProfileId}`).emit(
              "notification",
              data?.notification
            );
            io.to(`${data?.notification?.notificationToProfileId}`).emit(
              "accept-invitation",
              data?.room
            );
            return cb(data?.room);
          }
        }
      } catch (error) {
        return cb(error);
      }
    });

    socket.on("edit-message", async (params, cb) => {
      logger.info("edit-message", {
        ...params,
        address,
        id: socket.id,
        method: "edit-message",
      });
      try {
        if (params) {
          const data = await chatService.editMessage(params);
          if (params.groupId) {
            io.to(`${params?.groupId}`).emit("new-message", data);
          } else {
            io.to(`${params?.profileId}`).emit("new-message", data);
          }
          if (data) {
            return cb(data);
          }
        }
      } catch (error) {
        return cb(error);
      }
    });

    socket.on("delete-message", async (params, cb) => {
      logger.info("delete-message", {
        ...params,
        address,
        id: socket.id,
        method: "delete-message",
      });
      try {
        if (params) {
          const data = await chatService.deleteMessage(params);
          io.to(`${params?.profileId}`).emit("new-message", data);
          if (data) {
            return cb(data);
          }
        }
      } catch (error) {
        return cb(error);
      }
    });

    socket.on("delete-room", async (params, cb) => {
      logger.info("delete-room", {
        ...params,
        address,
        id: socket.id,
        method: "delete-room",
      });
      try {
        if (params) {
          const data = await chatService.deleteRoom(params);
          console.log(data);
          if (data?.notification) {
            io.to(`${data.notification?.notificationToProfileId}`).emit(
              "notification",
              data?.notification
            );
          }
          if (data) {
            return cb(data);
          }
        }
      } catch (error) {
        return cb(error);
      }
    });

    socket.on("start-call", async (params, cb) => {
      logger.info("start-call", {
        ...params,
        address,
        id: socket.id,
        method: "start-call",
      });
      try {
        if (params) {
          const data = await chatService.startCall(params);
          if (data?.notification) {
            if (params.groupId) {
              console.log("in=========>");
              io.to(`${params.groupId}`).emit("new-message", data.newMessage);
              if (data?.notification) {
                if (data?.notification) {
                  io.to(`${params.groupId}`).emit(
                    "notification",
                    data?.notification
                  );
                }
              }
            } else {
              console.log("start call=========>", data);
              io.to(`${params.roomId}`).emit("new-message", data.newMessage);
              if (data?.notification) {
                if (data?.notification) {
                  io.to(`${params.roomId}`).emit(
                    "notification",
                    data?.notification
                  );
                }
              }
            }
            // for (const key in data?.notifications) {
            //   if (Object.hasOwnProperty.call(data?.notifications, key)) {
            //     const notification = data?.notifications[key];
            //     io.to(`${notification.notificationToProfileId}`).emit(
            //       "notification",
            //       notification
            //     );
            //   }
            // }
          }
        }
      } catch (error) {
        return cb(error);
      }
    });

    socket.on("decline-call", async (params, cb) => {
      logger.info("decile-call", {
        ...params,
        address,
        id: socket.id,
        method: "decline-call",
      });
      try {
        if (params) {
          const data = await chatService.declineCall(params);
          if (params?.roomId) {
            io.to(`${params?.roomId}`).emit("notification", data);
            return cb(true);
          } else if (params.groupId) {
            console.log("decline-group-calll===>>>>>>>>>>>>>>>>>>>>>", data);
            io.to(`${params?.groupId}`).emit("notification", data);
            return cb(true);
          }
        }
      } catch (error) {
        return cb(error);
      }
    });

    socket.on("pick-up-call", async (params, cb) => {
      logger.info("pick-up-call", {
        ...params,
        address,
        id: socket.id,
        method: "pick-up-call",
      });
      try {
        if (params) {
          const data = await chatService.pickUpCall(params);
          if (params?.roomId) {
            io.to(`${params?.roomId}`).emit("notification", data);
            return cb(true);
          } else {
            io.to(`${params?.notificationToProfileId}`).emit(
              "notification",
              data
            );
            return cb(true);
          }
        }
      } catch (error) {
        return cb(error);
      }
    });

    // Group chats //
    socket.on("create-group", async (params, cb) => {
      logger.info("create-group", {
        ...params,
        address,
        id: socket.id,
        method: "create-group",
      });
      try {
        if (params) {
          const data = await chatService.createGroups(params);
          if (params.profileIds.length > 0) {
            for (const id of params.profileIds) {
              socket.join(`${id}`);
            }
          }
          socket.join(`${data.groupId}`);
          console.log("group", data.notifications);
          if (data?.notifications) {
            for (const key in data?.notifications) {
              if (Object.hasOwnProperty.call(data?.notifications, key)) {
                const notification = data?.notifications[key];
                io.to(`${notification.notificationToProfileId}`).emit(
                  "notification",
                  notification
                );
              }
            }
          }
          return cb(data?.groupList);
        }
      } catch (error) {
        return cb(error);
      }
    });

    socket.on("get-group-list", async (params, cb) => {
      // logger.info("get-group", {
      //   ...params,
      //   address,
      //   id: socket.id,
      //   method: "get-group",
      // });
      try {
        if (params) {
          const groupList = await chatService.getGroupList(params);
          // for (const key in groupList) {
          //   if (Object.hasOwnProperty.call(groupList, key)) {
          //     const group = groupList[key];
          //     // io.to(`${group.groupId}`).emit("join", group);
          //     socket.join(`${group.groupId}`);
          //     console.log(socket.id);
          //   }
          // }
          if (cb) {
            return cb(groupList);
          }
        }
      } catch (error) {
        cb(error);
      }
    });

    socket.on("get-group", async (params, cb) => {
      logger.info("get-group", {
        ...params,
        address,
        id: socket.id,
        method: "get-group",
      });
      try {
        if (params) {
          const groupList = await chatService.getGroup(params);
          if (cb) {
            return cb(groupList);
          }
        }
      } catch (error) {
        cb(error);
      }
    });

    socket.on("remove-member", async (params, cb) => {
      logger.info("remove-member", {
        ...params,
        address,
        id: socket.id,
        method: "remove-member",
      });
      try {
        if (params) {
          const groupList = await chatService.removeMember(params);
          if (cb) {
            return cb(groupList);
          }
        }
      } catch (error) {
        cb(error);
      }
    });

    socket.on("start-typing", async (params, cb) => {
      logger.info("start-typing", {
        ...params,
        address,
        id: socket.id,
        method: "start-typing",
      });
      try {
        if (params) {
          const data = {
            profileId: params.profileId,
            isTyping: params.isTyping,
            roomId: params.roomId,
            groupId: params.groupId,
          };
          data["userName"] = await chatService.getUserDetails(data.profileId);
          if (params.roomId) {
            io.to(`${data?.roomId}`).emit("typing", data);
          } else {
            io.to(`${data?.groupId}`).emit("typing", data);
          }
          if (cb) {
            return cb();
          }
        }
      } catch (error) {
        cb(error);
      }
    });

    socket.on("switch-group", async (params, cb) => {
      logger.info("switch-group", {
        ...params,
        address,
        id: socket.id,
        method: "switch-group",
      });
      try {
        if (params) {
          const data = await chatService.switchChat(params);
          if (cb) {
            return cb(true);
          }
        }
      } catch (error) {
        cb(error);
      }
    });
    socket.on("resend-chat-invite", async (params, cb) => {
      logger.info("resend-chat-invite", {
        ...params,
        address,
        id: socket.id,
        method: "resend-chat-invite",
      });
      try {
        if (params) {
          const data = await chatService.resendRoom(params);
          console.log(data);
          if (data.notification) {
            io.to(`${data.notification.notificationToProfileId}`).emit(
              "notification",
              data.notification
            );
          }
          if (cb) {
            return cb(data);
          }
        }
      } catch (error) {
        cb(error);
      }
    });
    socket.on("change-status", async (params, cb) => {
      logger.info("change-status", {
        ...params,
        address,
        id: socket.id,
        method: "change-status",
      });
      try {
        if (params) {
          const data = await chatService.changeUserStatus(params);
          if (cb) {
            return cb(data);
          }
        }
      } catch (error) {
        cb(error);
      }
    });
  });
};

module.exports = socket;
