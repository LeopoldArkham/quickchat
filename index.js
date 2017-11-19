var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var connected = 0;
var rooms = [];

// app.get('/', function(req, res) {
//     res.sendFile(__dirname + '/index.html');
// });

// Serve HTML
app.get('/rooms/:roomID', function(req, res) {
    res.sendFile(__dirname + '/chatroom.html');
})

// Associative array, tracks amount of connected users per room.
var rooms = new Object();

io.on('connection', function(socket){
    // Joining/creating a room
    socket.on('join', function(room, username) {
        // Track number of users in room        
        if (room in rooms) {
            rooms[room]++;
        } else {
            rooms[room] = 1;
        }
        
        // Propagate number of users
        socket.join(room);
        io.to(room).emit('nb_users', rooms[room]);
        // Persist rom ID and username on the socket itself
        socket.room = room;
        socket.username = username;

        // Handle disconnects
        socket.on('disconnect', function () {
            rooms[room]--;
            io.to(room).emit('nb_users', rooms[room]);
        })
    });

    // Propagate recieved messages
    socket.on('msg', function(_msg){
      io.to(socket.room).emit('msg', socket.username.length == 0? "Default":socket.username, _msg);
    });
  });



http.listen(3000, function() {
    console.log("Listening on port 3000");
});