var app = angular.module("tttApp",[])
				.controller("tttController",function($scope){
					var gameBoard = [{zero:'',one:'',two:'',id:'r1'},
									 {zero:'',one:'',two:'',id:'r2'},
									 {zero:'',one:'',two:'',id:'r3'}
									];
					$scope.gameBoard = gameBoard;
					$scope.isMyTurn = false;
					$scope.loggedIn = false;
					$scope.validMove =false;
					$scope.message = "Waiting for an opponent...";
					$scope.socket = io.connect();
					$scope.name="";
					$scope.opponentConnected = false;
					$scope.opponent=""; 
					$scope.coins='';
					$scope.opponentCoins='';
					$scope.socket.on('registered user',function(data){
								console.log(data);
								$scope.value = data.val;
								$scope.coins = data.coins;
								$scope.opponent=data.pair;
								$scope.opponentCoins=data.pairCoins;
								$scope.isMyTurn = data.turn;
								if($scope.opponent != ''){
									$scope.opponentConnected = true;
									$scope.message = "Oppponent connected";
								}
									 
								$scope.$apply();
								});
					$scope.socket.on('update board',function(data){
								$scope.gameBoard = data;
								 $scope.$apply();
								});
					
					$scope.socket.on('opponent connected',function(data){
								 console.log(data);
								 $scope.opponentConnected = true;
								 $scope.opponent = data.pair;
								 $scope.opponentCoins=data.pairCoins;
								 $scope.isMyTurn = data.turn;
								 $scope.message = "Oppponent connected"
								 $scope.$apply();
								});

					$scope.socket.on('your turn',function(data){
								console.log('Your turn:' + data);
								$scope.isMyTurn = data;
								 $scope.$apply();
								});
						
					$scope.submitChange = function(row,key) {
							$scope.validMove = false;
        					$scope.gameBoard = $scope.updateGameBoard($scope.gameBoard,row,key,$scope.value);
        					if($scope.validMove)
								$scope.socket.emit('submit move',$scope.gameBoard);
    						}
    				$scope.updateGameBoard = function(gameBoard, row, key,val){
    					for(var gameRow in gameBoard)
							if(gameBoard[gameRow].id == row && gameBoard[gameRow][key] == ''){
								gameBoard[gameRow][key] = val;
								$scope.validMove = true;
								break;
								}
							return gameBoard;	
    				}
    				$scope.enterGame = function(){
    					console.log("In game...");
    					$scope.loggedIn = true;
    					$scope.socket.emit('register',$scope.name);
    				}		

				});