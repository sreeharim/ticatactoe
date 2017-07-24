var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var users = [];
server.listen(3000);
app.use(express.static(__dirname+"/public"));

io.sockets.on('connection',function(socket){
socket.on('register',function(data){
	//checking for duplicate username..
	var validName = true;
	for(var i in users){
		if(data == users[i].socket.name){
			validName = false;
			socket.emit("invalid name","Nickname already taken...try another");
			break;
		}
	}
	if(validName){
		console.log('Registration started for user..'+data);
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
	socket.pairCoins = '';

	newGame(data);
	newUser.socket = socket;
	users.push(newUser); 
	socket.emit('registered user','success');
	
	}
	
});
 //on a successfull move update the board
 socket.on('submit move',function(data){
 	var pairSocket = findPairSocket(socket.pairName);
 	socket.emit('your turn',false);
 	pairSocket.emit('your turn',true);
 	socket.emit('update board',data);
 	pairSocket.emit('update board',data);
 });
 //on newGame request find a free user
 socket.on("new game",function(data){
 	newGame(socket.name);	
 });
 //on disconnect remove user and inform opponent
 socket.on('disconnect',function(data){
 	console.log('Disconnecting user....'+socket.name);
 	var pairSocket = findPairSocket(socket.pairName);
 	if(pairSocket){
 		pairSocket.pairName="";
 		pairSocket.isPaired = false;
 		pairSocket.emit('opponent disconnected','Opponent disconnected');	
 	}
 	index = getUserIndex(socket.name)
 	users.splice(index,1);
 });

function newGame(name){
	var upSocket = getUnpairedSocket(name);
	if(upSocket){
		if(upSocket.value == 'X'){ //setting up new user value based on pair value
			socket.value = 'O';
			socket.turn = false;
			upSocket.turn = true;
			}
		else{
			socket.value = 'X';
			socket.turn = true;
			upSocket.turn = false;
		} 
			socket.isPaired = true;
			socket.name = name;
			socket.pairName = upSocket.name;
			socket.pairCoins = upSocket.coins;
			upSocket.pairName = name; 
			upSocket.isPaired = true; 		
			upSocket.emit('opponent connected',{'val':upSocket.value,'turn':upSocket.turn,'coins':upSocket.coins,'pair':socket.name,'pairCoins':socket.coins});
			socket.emit('opponent connected',{'val':socket.value,'turn':socket.turn,'coins':socket.coins,'pair':socket.pairName,'pairCoins':socket.pairCoins});
	}
}

function getUserIndex(name){
	for(var i in users)
		if(users[i].socket.name == name)
			return i;
	
}

function getUnpairedSocket(name){
	for(var i in users){
		if(!(users[i].socket.isPaired) && users[i].socket.name != name)
			return users[i].socket;
	}
}

function findPairSocket(name){
	for(var i in users)
		if(users[i].socket.name == name)
			return users[i].socket;
	return null;
}
});
