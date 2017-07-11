var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var users = [];
server.listen(3000);
app.use(express.static(__dirname+"/public"));

io.sockets.on('connection',function(socket){
socket.on('register',function(data){
	console.log('Registration started');
	var newUser = {};
	if(users.length == 0){
		socket.value=0;
		socket.turn = true;
		newUser.val = socket.value;
		newUser.turn = socket.turn; 
		newUser.socket = socket;
		users.push(newUser)
	}
	else if(users.length == 1){
		socket.value=1;
		socket.turn = true;
		newUser.val = socket.value;
		newUser.turn = socket.turn;
		newUser.socket = socket;
		users.push(newUser); 
	}
		
	socket.emit('registered user',{'val':newUser.val,'turn':newUser.turn});
});
 socket.on('send message',function(data){
 	//console.log('recieved message'+ data);
 	io.sockets.emit('new message',data);
 });
 socket.on('submit move',function(data){

 	io.sockets.emit('update board',data);
 })
});