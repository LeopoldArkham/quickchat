var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var connected = 0;
var rooms = [];

// Serve root
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

// Serve room
app.get('/rooms/:roomID', function(req, res) {
    res.sendFile(__dirname + '/chatroom.html');
})

// Associative array, tracks amount of connected users per room.
var rooms = new Object();

io.on('connection', function(socket){
    // Joining/creating a room
    socket.on('join', function(room, username) {
        // Track number of users in room        
        if (!(room in rooms)) {
            rooms[room] = new Room(room, "");
        }
        rooms[room].userConnected();
        
        // Propagate number of users
        socket.join(room);
        io.to(room).emit('nb_users', rooms[room].connectedUsers);
        // Persist rom ID and username on the socket itself
        socket.room = room;
        socket.username = username;

        // Handle disconnects
        socket.on('disconnect', function () {
            rooms[room].users--;
            io.to(room).emit('nb_users', rooms[room].connectedUsers);
        })
    });

    // Propagate recieved messages
    socket.on('msg', function(_msg){
      io.to(socket.room).emit('msg', socket.username, _msg);
    });
  });



http.listen(process.env.PORT || 3000, function() {
    console.log("Listening on port 3000");
});