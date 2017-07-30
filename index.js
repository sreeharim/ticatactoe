var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var users = [];
server.listen(3000);
app.use(express.static(__dirname+"/public"));

io.sockets.on('connection',function(socket){
//register new user connected	
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
		initSocket(data);
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
 	socket.emit('update board',data);
 	pairSocket.emit('update board',data);
 	setTimeout(function(){
 			socket.bidSubmit=false;
 			socket.bidAmount=0;
 			pairSocket.bidSubmit=false;
 			pairSocket.bidAmount=0;  
			pairSocket.emit('prompt bid','Submit bid');
			socket.emit('prompt bid','Submit bid');	
		 }, 5000);
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
 		pairSocket.isPaired = false;
 		pairSocket.value = 'X';
		pairSocket.turn = false;
		pairSocket.isPaired = false;
		pairSocket.pairName = '';
		pairSocket.coins = 100;
		pairSocket.pairCoins = '';
		pairSocket.bidSubmit = false;
		pairSocket.bidAmount = 0;
 		pairSocket.emit('opponent disconnected','Opponent disconnected');	
 	}
 	index = getUserIndex(socket.name)
 	users.splice(index,1);
 });
 socket.on('submit bid', function(data){
 	console.log('Submitting bid');
 	socket.bidSubmit = true;
 	socket.bidAmount = data;
 	var pairSocket = findPairSocket(socket.pairName);
 	if(pairSocket){
 		if(pairSocket.bidSubmit){
 			if(pairSocket.bidAmount >= socket.bidAmount){//opponent won the bid
 				socket.coins+=pairSocket.bidAmount;
 				pairSocket.coins-=pairSocket.bidAmount;
 				socket.turn = false;
				pairSocket.turn = true;
 				socket.emit('lost bid',{'coins':socket.coins,'pairCoins':pairSocket.coins,'wonBid':pairSocket.bidAmount,'lostBid':socket.bidAmount});
 				pairSocket.emit('won bid',{'coins':pairSocket.coins,'pairCoins':socket.coins,'wonBid':pairSocket.bidAmount,'lostBid':socket.bidAmount});
 			}
 			else{
 				socket.coins-=socket.bidAmount;
 				pairSocket.coins+=socket.bidAmount;
 				socket.turn = true;
				pairSocket.turn = false;
 				socket.emit('won bid',{'coins':socket.coins,'pairCoins':pairSocket.coins,'wonBid':socket.bidAmount,'lostBid':pairSocket.bidAmount});
 				pairSocket.emit('lost bid',{'coins':pairSocket.coins,'pairCoins':socket.coins,'wonBid':socket.bidAmount,'lostBid':pairSocket.bidAmount});
 			}
 			setTimeout(function(){
 				
				pairSocket.emit('end bid','');
				socket.emit('end bid','');
 				socket.emit('your turn',socket.turn);
 				pairSocket.emit('your turn',pairSocket.turn);
			 }, 5000);

 		}
 		else{
 			socket.emit('wait opponent bid',"");
 		}
 	}
 });
function initSocket(name){
	//default values
	socket.value = 'X';
	socket.turn = false;
	socket.isPaired = false;
	socket.name = name;
	socket.pairName = '';
	socket.pairIndex = -1;
	socket.coins = 100;
	socket.pairCoins = '';
	socket.bidSubmit = false;
	socket.bidAmount = 0;
} 
function newGame(name){
	var upSocket = getUnpairedSocket(name);
	if(upSocket){
		if(upSocket.value == 'X') //setting up new user value based on pair value
			socket.value = 'O';
		else
			socket.value = 'X';
		socket.isPaired = true;
		socket.name = name;
		socket.pairName = upSocket.name;
		socket.pairCoins = upSocket.coins;
		upSocket.pairName = name; 
		upSocket.isPaired = true; 		
		upSocket.emit('opponent connected',{'val':upSocket.value,'turn':upSocket.turn,'coins':upSocket.coins,'pair':socket.name,'pairCoins':socket.coins});
		socket.emit('opponent connected',{'val':socket.value,'turn':socket.turn,'coins':socket.coins,'pair':socket.pairName,'pairCoins':socket.pairCoins});
		setTimeout(function(){ 
			upSocket.emit('prompt bid','Submit bid');
			socket.emit('prompt bid','Submit bid');	
		 }, 3000);
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
