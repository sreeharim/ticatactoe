var app = angular.module("tttApp",[])
				.controller("tttController",function($scope){
					var gameBoard = [{zero:-1,one:-1,two:-1,id:"r1"},
									 {zero:-1,one:-1,two:-1,id:"r2"},
									 {zero:-1,one:-1,two:-1,id:"r3"}
									];
					$scope.gameBoard = gameBoard;
					$scope.isMyTurn = false;						
					$scope.submitChange = function(row,key) {
        				submitChanges(row,key);
    						};

				});