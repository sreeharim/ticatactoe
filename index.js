var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var users = [];
server.listen(process.env.PORT ||3000);
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
		//newGame(data);
		newUser.socket = socket;
		users.push(newUser); 
		socket.emit('registered user','success');
		console.log("No of users:"+users.length);
		io.sockets.emit('update users',getUserList());
		socket.emit('show users','');
	}
	
});
 //on a successfull move update the board
 socket.on('submit move',function(data){
 	var pairSocket = findPairSocket(socket.pairName);
 	socket.emit('your turn',false);
 	socket.emit('update board',data);
 	if(pairSocket)
 		pairSocket.emit('update board',data);
 	var won = didIWin(data);
 	if(won){
 		socket.emit('game over','You won');
 		if(pairSocket)
	 		pairSocket.emit('game over','You lost');	
 	}
 	else{
 		var drawn = isGameDrawn(data);
 		if(drawn){
 			if(pairSocket && pairSocket.coins > socket.coins){
 				socket.emit('game over','You lost');
	 			pairSocket.emit('game over','You won');
 			}
 			else if(pairSocket && pairSocket.coins < socket.coins){
 				socket.emit('game over','You won');
	 			pairSocket.emit('game over','You lost');
 			}
 			else if(pairSocket && pairSocket.coins == socket.coins){
 				socket.emit('game over','Game drawn');
	 			pairSocket.emit('game over','Game drawn');
 			}
 		}
 		else{
 			setTimeout(function(){
 			socket.bidSubmit=false;
 			socket.bidAmount=0;
 			if(pairSocket){
 				pairSocket.bidSubmit=false;
 				pairSocket.bidAmount=0;  
				pairSocket.emit('prompt bid','Submit bid');
 			}
			socket.emit('prompt bid','Submit bid');	
		 }, 5000);	
 		}
 		
 	}
 	
 });
 //on newGame request find a free user
 socket.on("new game",function(data){
 	initSocket(socket.name);
 	newGame(socket.name);	
 });
 socket.on("end game",function(data){
 	var pairSocket = findPairSocket(socket.pairName);
 	initSocket(socket.name);
 	socket.isPaired = false;
 	
 	if(pairSocket){
 		pairSocket.isPaired = false;
 		pairSocket.emit('opponent left','Opponent left');
 		
 	}
 	io.sockets.emit('update users',getUserList());
 	socket.emit('show users','');
 	if(pairSocket)
 		pairSocket.emit('show users','');
 });
 //on newGame request find a free user
 socket.on("send req",function(data){
 	initSocket(socket.name);
 	newReq(socket.name,data);
 	io.sockets.emit('remove users',{'name1':socket.name,'name2':data});
 });
  socket.on("send resp",function(data){
  	initSocket(socket.name);
  	var upSocket = findPairSocket(data.name);
 	if(data.accept)
 		newGame(data.name);
 	else{
 		if(upSocket)
 			upSocket.emit('declined req','');
 		setTimeout(function(){ 
 			io.sockets.emit('update users',getUserList());
 			if(upSocket)
 				upSocket.emit('show users','');
 			 },3000);
 	}

 });
 //on disconnect remove user and inform opponent
 socket.on('disconnect',function(data){
 	if(socket.name){
 		console.log('Disconnecting user....'+socket.name);
 		var pairSocket = findPairSocket(socket.pairName);
 		index = getUserIndex(socket.name)
 		users.splice(index,1);
 		socket.name='';
 		io.sockets.emit('update users',getUserList());
 		if(pairSocket){
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
 		
 	}
 	
 });
 socket.on('submit bid', function(data){
 	console.log('Submitting bid');
 	socket.bidSubmit = true;
 	socket.bidAmount = data;
 	var pairSocket = findPairSocket(socket.pairName);
 	if(pairSocket){
 		if(pairSocket.bidSubmit){
 			if(pairSocket.bidAmount >= socket.bidAmount){//opponent won the bid
 				var bidDiff = pairSocket.bidAmount-socket.bidAmount
 				socket.coins+=bidDiff;
 				pairSocket.coins-=bidDiff;
 				socket.turn = false;
				pairSocket.turn = true;
 				socket.emit('lost bid',{'coins':socket.coins,'pairCoins':pairSocket.coins,'wonBid':pairSocket.bidAmount,'lostBid':socket.bidAmount});
 				pairSocket.emit('won bid',{'coins':pairSocket.coins,'pairCoins':socket.coins,'wonBid':pairSocket.bidAmount,'lostBid':socket.bidAmount});
 			}
 			else{
 				var bidDiff = socket.bidAmount-pairSocket.bidAmount;
 				socket.coins-=bidDiff;
 				pairSocket.coins+=bidDiff;
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
 function didIWin(data){
 	//checking rows
 	for(var row in data){
 		if(data[row].zero!='' && data[row].zero == data[row].one && data[row].zero == data[row].two){
 			return true;
 		}
 	}
 	//checking coloums
 	if((data[0].zero !='' && data[0].zero == data[1].zero && data[0].zero == data[2].zero)||
 	   (data[0].one !='' && data[0].one == data[1].one && data[0].one == data[2].one)||
 	   (data[0].two !='' && data[0].two == data[1].two && data[0].two == data[2].two)){
 		return true;
 	}
 	//checking diagonals
 	if((data[0].zero != '' && data[0].zero == data[1].one && data[0].zero == data[2].two)||
 	   (data[0].two != '' && data[0].two == data[1].one && data[0].two == data[2].zero)){
 		return true;
 	}
 	return false;
 }

 function isGameDrawn(data){
 	//check if the all the cells are filled
 	for(var row in data)
 		if(data[row].zero=='' || data[row].one == '' || data[row].two =='')
 			return false;
 	return true;	
 }
function initSocket(name){
	//default values
	socket.value = 'X';
	socket.turn = false;
	socket.isPaired = false;
	socket.name = name;
	socket.pairName = '';
	socket.coins = 100;
	socket.pairCoins = '';
	socket.bidSubmit = false;
	socket.bidAmount = 0;
} 
function newGame(name){
	var upSocket = findPairSocket(name);
	if(upSocket){
		if(upSocket.value == 'X') //setting up new user value based on pair value
			socket.value = 'O';
		else
			socket.value = 'X';
		
		socket.pairName = upSocket.name;
		upSocket.pairName = socket.name; 
		socket.pairCoins = upSocket.coins;
		upSocket.pairCoins = socket.coins
		socket.isPaired = true;
		upSocket.isPaired = true; 		
		upSocket.emit('opponent connected',{'val':upSocket.value,'turn':upSocket.turn,'coins':upSocket.coins,'pair':socket.name,'pairCoins':socket.coins});
		socket.emit('opponent connected',{'val':socket.value,'turn':socket.turn,'coins':socket.coins,'pair':socket.pairName,'pairCoins':socket.pairCoins});
		setTimeout(function(){
		 	if(upSocket.name !='' && socket.name !=''){
		 	upSocket.emit('prompt bid','Submit bid');
			socket.emit('prompt bid','Submit bid');		
		 	}
			
		 }, 3000);
	}
}
function newReq(from,to){
	var toSocket = findPairSocket(to);
	if(toSocket)
		toSocket.emit('request game',from);
}

function getUserIndex(name){
	for(var i in users)
		if(users[i].socket.name == name)
			return i;
	
}
//get list of users and their status
function getUserList(){
	var userList = [];
	for(var i in users)
		if(!(users[i].socket.isPaired))
		userList.push({"name":users[i].socket.name});
	return userList;
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
