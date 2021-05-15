const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

var path = require('path');
var users = [];


app.get('/', (req, res) => {
 res.send("welcome, my guy");

});

io.on('connection', (socket) => {
  var clientId = socket.id;
  var currentRoom = '';
  users.push(clientId);

  console.log('user ' + clientId + ' connected ');


  socket.on('joinRoom', (room) => {

    //check number of clients in room
    var clientsInRoom = io.sockets.adapter.rooms.get(room);

    var numClients = clientsInRoom === undefined ? 0 : clientsInRoom.size;

    //max two clients
    if (numClients === 2) {
      socket.emit('full', room);
      console.log('full');
      return;
    }


    if (numClients === 0) {
      socket.join(room);
      currentRoom = room;
      console.log('Client ID ' + socket.id + ' created room ' + room);
      socket.emit('joined', room, socket.id);
    } else {
      console.log('Client ID ' + socket.id + ' joined room ' + room);
      io.sockets.in(room).emit('join', room);
      socket.join(room);
      currentRoom = room;
      socket.emit('joined', room, socket.id);
      io.sockets.in(room).emit('ready');
    }

    console.log('Room ' + room + ' now has ' + (numClients + 1) + ' client(s)');

  });




  socket.on('pressDetection', (senderName, state) => {
    if (currentRoom != '') {
      //log message
      var message = (state) ? " has pressed" : " has released";
      console.log(currentRoom + ": " + senderName + message);

      //send to other client
      socket.to(currentRoom).emit('otherPress', state);
    }
  });



  //Fixa sa att mottagare reagerar pa kombination av tryck+signal



  socket.on('disconnect', function () {

    for (let i = 0; i < users.length; i++) {
      if (users[i] === clientId) {
        users.splice(i, 1);
      }
    }

    console.log('user ' + clientId + ' has left');
    socket.broadcast.emit('userDisconnect', 'user has left');

  });


});
http.listen(3000, () => {
  console.log('listening on *:3000');
});





