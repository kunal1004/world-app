const {generateMessage, generateLocationMessage} = require('./util/message');
const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');
const {isRealString} = require('./util/validation');
const {Users} = require('./util/users');


const publicPath = path.join(__dirname, '../public');
const port = process.env.PORT || 3000;
var app = express();
var server = http.createServer(app);
var io = socketIO(server);
var users = new Users();

app.use(express.static(publicPath));


io.on('connection', (socket) =>{
console.log("new user connected");

//socket.emit('newMessage',{
//  from: 'Admin',
//  text: 'Welcome to the chat app',
//  createdAt: new Date().getTime()
//});

//socket.broadcast.emit('newMessage', {
//  from: 'Admin',
//  text: 'new user joined',
//  createdAt: new Date().getTime()
//});

socket.on('join', (params, callback) => {
  if (!isRealString(params.name)|| !isRealString(params.room)){
  return  callback('Name and room are required ');
  }
 socket.join(params.room);
 users.removeUser(socket.id);
 users.addUser(socket.id, params.name, params.room);

  io.to(params.room).emit('updateUserList', users.getUserList(params.room));
  socket.emit('newMessage', generateMessage('Admin', 'Welcome to the chat app'));
  socket.broadcast.to(params.room).emit('newMessage', generateMessage('Admin', '' +params.name+ '  has joined'));
  callback();
});

socket.on('createMessage', (message, callback)=> {
  var user = users.getUser(socket.id);

  if(user && isRealString(message.text)){
    io.to(user.room).emit('newMessage', generateMessage(user.name, message.text));
  }

    callback();


  //  from: message.from,
  //  text: message.text,
  //  createdAt: new Date().getTime()
//  });
  //socket.broadcast.emit('newMessage',{
  //  from: message.from,
  //  text: message.text,
  //  createdAt:new Date().getTime()
//  })
});
socket.on('createLocationMessage', (coords)=> {
    var user = users.getUser(socket.id);
    if (user){
      io.to(user.room).emit('newLocationMessage',generateLocationMessage(''+user.name+'', coords.latitude , coords.longitude ));
    }
//  io.emit('newMessage',generateMessage('Admin', 'latitude -' +coords.latitude+ ' longitude -' +coords.longitude ));

});

socket.on('disconnect', () =>{
  var user = users.removeUser(socket.id);

  if (user) {
    io.to(user.room).emit('updateUserList', users.getUserList(user.room));
    io.to(user.room).emit('newMessage', generateMessage('Admin', ''+user.name+ ' has left.'));

  }

});
});

server.listen(port, () => {
  console.log('Server is UP in ');
})
