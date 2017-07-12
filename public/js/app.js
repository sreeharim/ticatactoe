var app = angular.module("tttApp",[])
				.controller("tttController",function($scope){
					var gameBoard = [{zero:-1,one:-1,two:-1,id:"r1"},
									 {zero:-1,one:-1,two:-1,id:"r2"},
									 {zero:-1,one:-1,two:-1,id:"r3"}
									];
					$scope.gameBoard = gameBoard;
					$scope.isMyTurn = false;
					$scope.socket = io.connect();
					$scope.socket.emit('register','register');
					$scope.socket.on('registered user',function(data){
								console.log(data);
								$scope.value = data.val;
								$scope.isMyTurn = data.turn;
								});
					$scope.socket.on('update board',function(data){
								$scope.gameBoard = data;
								 $scope.$apply();
								});
					$scope.socket.on('your turn',function(data){
								$scope.isMyTurn = data;
								 //$scope.$apply();
								});
						
					$scope.submitChange = function(row,key) {
        					$scope.gameBoard = $scope.updateGameBoard($scope.gameBoard,row,key,$scope.value);
							$scope.socket.emit('submit move',$scope.gameBoard);
    						}
    				$scope.updateGameBoard = function(gameBoard, row, key,val){
    					for(var gameRow in gameBoard)
							if(gameBoard[gameRow].id == row && gameBoard[gameRow][key] == -1){
								gameBoard[gameRow][key] = val;
								break;
								}
							return gameBoard;	
    				}		

				});