var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var express = require("express");

app.use(express.static(__dirname + "client/build"));

// Serve root
app.get("/", function(req, res) {
  res.sendFile(__dirname + "/client/build/index.html");
});

// Associative array, tracks amount of connected users per room.
var rooms = new Object();

// Tracks a chatroom's persisted properties.
// Also an accidental pun.
class Room {
  constructor(name, pw) {
    this.name = name;
    this.pw = pw;
    this.connected = 0;
  }

  userConnected() {
    return ++this.connected;
  }

  userDisonnected() {
    return --this.connected;
  }

  get connectedUsers() {
    return this.connected;
  }

  isProtected() {
    return this.pw.length > 0;
  }

  validatePW(candidate) {
    return this.pw == candidate;
  }
}

io.on("connection", function(socket) {
  console.log("Client connected");
  // Creates a password protected room
  socket.on("room-with-pw", function(room_name, pw) {
    rooms[room_name] = new Room(room_name, pw);
    console.log("Created room " + room_name + " with password: " + pw);
  });

  // Joining/creating a room
  socket.on("join", function(room, username) {
    // Track number of users in room
    if (!(room in rooms)) {
      rooms[room] = new Room(room, "");
    } else if (rooms[room].isProtected()) {
      // Can't join a protected room through here.
      return;
    }
    rooms[room].userConnected();

    // Propagate number of users
    socket.join(room);
    io.to(room).emit("nb_users", rooms[room].connectedUsers);
    // Persist room ID and username on the socket itself
    socket.room = room;
    socket.username = username;

    // Handle disconnects
    socket.on("disconnect", function() {
      rooms[room].userDisonnected();
      io.to(room).emit("nb_users", rooms[room].connectedUsers);
    });
  });

  // Joining/creating a room
  socket.on("join-protected", function(room, username, pw) {
    if (rooms[room].validatePW(pw)) {
      rooms[room].userConnected();

      // Propagate number of users
      socket.join(room);
      io.to(room).emit("nb_users", rooms[room].connectedUsers);
      // Persist room ID and username on the socket itself
      socket.room = room;
      socket.username = username;
      io.to(room).emit("auth-ok");

      // Handle disconnects
      socket.on("disconnect", function() {
        rooms[room].userDisonnected();
        io.to(room).emit("nb_users", rooms[room].connectedUsers);
      });
    }
  });

  // Propagate recieved messages
  socket.on("msg", function(_msg) {
    io.to(socket.room).emit("msg", socket.username, _msg);
    console.log("Propagating message");
  });

  socket.on("check-protected", function(room) {
    var r;
    if (room in rooms) {
      if (rooms[room].isProtected()) {
        r = true;
      } else {
        r = false;
      }
    }
    io.to(socket.id).emit("is-protected", r);
  });
});

http.listen(process.env.PORT || 5000, function() {});
