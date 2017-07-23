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
	var newUser = {};//new user
	var foundPair = false;
	//default values
	socket.value = 'X';
	socket.turn = true;
	socket.isPaired = false;
	socket.name = data;
	socket.pairName = '';
	socket.pairIndex = -1;
	socket.coins = 100;
	socket.pairCoins = -1;

	console.log('No of Users:'+users.length);
	for(var i in users){
	 	    console.log('User at index '+i+' is paired :'+users[i].socket.isPaired);                // checking for unpaired users 
		if(!(users[i].socket.isPaired)){            //found unpaired user
			console.log('Found pair at index:'+i);
			if(users[i].socket.value == 'X'){ //setting up new user value based on pair value
				socket.value = 'O';
				socket.turn = false;
				users[i].socket.turn = true;
			} 
				
			socket.isPaired = true;
			socket.name = data;
			socket.pairName = users[i].socket.name;
			socket.pairIndex = i;
			socket.pairCoins = users[i].socket.coins;
			users[i].socket.pairName = data; 
			users[i].socket.pairIndex = users.length;
			users[i].socket.isPaired = true; 		
			users[i].socket.emit('opponent connected',{'turn':users[i].socket.turn,'pair':socket.name,'pairCoins':socket.coins});
			break;

		}
	}
	
	newUser.socket = socket;
	users.push(newUser); 
	
	var registeredUser = {
						  'val':newUser.socket.value,
						  'turn':newUser.socket.turn,
						  'pair':newUser.socket.pairName,
						  'coins':newUser.socket.coins,
						  'pairCoins':newUser.socket.pairCoins
						  };	
	socket.emit('registered user',registeredUser);
});

 socket.on('submit move',function(data){
 	socket.emit('your turn',false);
 	users[socket.pairIndex].socket.emit('your turn',true);
 	socket.emit('update board',data);
 	users[socket.pairIndex].socket.emit('update board',data);
 });
});