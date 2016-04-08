var mp4Controllers = angular.module('mp4Controllers', []);

mp4Controllers.controller('AddUserController', ['$scope', 'Users'  , function($scope, Users) {
    $scope.addUserMessage = "";
    $scope.username = "";
    $scope.email = "";
    $('#alert').css("display", "none");

    $scope.addUser = function(){
        var user = "name=" + encodeURIComponent($scope.username) + "&email=" + encodeURIComponent($scope.email);
        Users.postUsers(user).success(function(data){
            $scope.addUserMessage = data.message;
            $scope.username = "";
            $scope.email = "";
            $('#alert').css("display", "block");
        }).error(function(error){
            $scope.addUserMessage = error.message;
            $('#alert').css("display", "block");
        });       
    }
}]);

mp4Controllers.controller('UserController', ['$scope', 'Users', 'Tasks', '$routeParams', function($scope, Users, Tasks, $routeParams) {
    $scope.userid = $routeParams.userid;
    $scope.username = "";
    $scope.email = "";

    getTasks();

    function getTasks() {
        $scope.tasks = [];
        Users.query("where={'_id': '" + $scope.userid + "'}")
        .success(function(data){
            var user = data.data[0];
            $scope.username = user.name;
            $scope.email = user.email;
            var pendingTasks = user.pendingTasks;
            console.log(pendingTasks);
            for(var i=0; i<pendingTasks.length; i++){
                Tasks.getTask(pendingTasks[i]).success(function(task){
                    $scope.tasks.push(task.data);
                });
            }
        });
    } 

    $scope.complete = function(task, index) {
        var originalTask = JSON.parse(JSON.stringify(task));
        task.completed = true;
        Tasks.putTask(task._id, task, originalTask).success(function(data){
            $scope.tasks.splice(index, 1);
        });
    }

    $scope.showCompleted = function() {
        Tasks.query("where={'assignedUser': '" + $scope.userid + "', 'completed': true}").success(function(data){
            $scope.completedTasks = data.data;
        });
    }
}]);

mp4Controllers.controller('UserListController', ['$scope', '$http', 'Users', 'Tasks', '$window' , function($scope, $http, Users, Tasks, $window) {
    $scope.message = "";
    $('#alert').css("display", "none");

    Users.getUsers().success(function(data){
        $scope.users = data.data;
    });

    $scope.deleteUser = function(userid) {
        Users.deleteUser(userid)
        .success(function(data){
            $scope.message = data.message;
            Users.getUsers().success(function(data){
                $scope.users = data.data;
            });
            $('#alert').css("display", "block");
        })
        .error(function(error){
            $scope.message = error.message;
            $('#alert').css("display", "block");
        });
    }

}]);

mp4Controllers.controller('TaskController', ['$scope', 'Users', 'Tasks', '$routeParams', function($scope, Users, Tasks, $routeParams) {
    $scope.taskid = $routeParams.taskid;

    Tasks.query("where={'_id': '" + $scope.taskid + "'}")
    .success(function(data){
        var task = data.data[0];
        $scope.task = task;
    });

}]);

mp4Controllers.controller('EditTaskController', ['$scope', 'Users', 'Tasks', '$routeParams', function($scope, Users, Tasks, $routeParams) {
    $scope.taskid = $routeParams.taskid;
    $scope.task = null;
    $scope.message = "";
    var originalTask = null
    $('#alert').css("display", "none");
    getTask();

    function getTask(){
        Tasks.query("where={'_id': '" + $scope.taskid + "'}")
        .success(function(data){
            var task = data.data[0];
            originalTask = JSON.parse(JSON.stringify(task));
            task.deadline = new Date(task.deadline);
            $scope.task = task;
            if($scope.task.completed)
                $scope.completed = "true";
            else
                $scope.completed = "false";
            if($scope.task.assignedUserName==="unassigned") {
                $scope.selected = '';
            }
            else {
                $scope.selected = $scope.task.assignedUserName;
            }
        });
    }

    Users.getUsers().success(function(data){
        $scope.users = data.data.map(function(user){
            return user.name;
        });
        $scope.users.unshift('');
    });

    $scope.submitEditTask = function() {
        $scope.task.assignedUserName = $scope.selected;
        $scope.task.completed = eval($scope.completed);
        Tasks.putTask($scope.taskid, $scope.task, originalTask).success(function(data){
            $scope.message = data.message;
            $('#alert').css("display", "block");
            getTask();
        }).error(function(err){
            $scope.message = err.message;
            $('#alert').css("display", "block");
        });
    }
}]);

mp4Controllers.controller('TaskListController', ['$scope', '$http', 'Users', 'Tasks', '$window', '$filter', function($scope, $http, Users, Tasks, $window, $filter) {
    $scope.message = "";
    $('#alert').css("display", "none");
    $scope.status = "pending";
    $scope.sort = "dateCreated";
    $scope.order="ascending";
    $scope.skip = 0;
    $scope.limit = 10;

    function getAll() {
        var getStatus = null;
        if($scope.status === "all") {
            Tasks.getTasks().success(function(data){
                $scope.all = data.data.length;
            });
        }
        else {
            if($scope.status === "pending")
                getStatus = false;
            else 
                getStatus = true;
            Tasks.query("where={'completed':" + getStatus + "}").success(function(data2){
                $scope.all = data2.data.length;
            }); 
        }
    }

    Tasks.query("where={'completed': false}&sort={'dateCreated':1}&skip=0&limit=" + $scope.limit).success(function(data){
        console.log("inital query");
        $scope.tasks = data.data;
        getAll();
    });

    $scope.deleteTask = function(taskid) {
        Tasks.deleteTask(taskid)
        .success(function(data){
            $scope.message = data.message;
            $scope.changeTasks();
            $scope.all--;
            $('#alert').css("display", "block");
        })
        .error(function(error){
            $scope.message = error.message;
            $('#alert').css("display", "block");
        });
    }

    $scope.skipTasks = function(prev) {
        if(prev && $scope.skip > 0) {
            console.log("here1");
            $scope.skip -= $scope.limit
            $scope.changeTasks();
        }   
        else if(!prev && ($scope.skip+$scope.limit<$scope.all)) {
            console.log("here2");
            $scope.skip += $scope.limit;
            $scope.changeTasks();
        }
        console.log("in skip");

    }

    $scope.changeStatus = function(){
        $scope.skip=0;
        getAll();
        $scope.changeTasks();
    }

    $scope.changeTasks = function() {
        var query = "sort={'" + $scope.sort + "':";
        if($scope.order==="ascending")
            query += "1}&skip=" + $scope.skip + "&limit=" + $scope.limit;
        else
            query += "-1}&skip=" + $scope.skip + "&limit=" + $scope.limit;
        console.log(query);
        if($scope.status === "all") {
            Tasks.query(query).success(function(data){
                $scope.tasks = data.data;
            });
        }
        else {
            if($scope.status === "pending") 
                query = "where={'completed': false}&" + query;
            else
                query = "where={'completed': true}&" + query;
            Tasks.query(query).success(function(data){
                $scope.tasks = data.data;
            });
        }
    }

    $scope.$watch('status', $scope.changeStatus, true);
    $scope.$watch('sort', $scope.changeTasks, true);
    $scope.$watch('order', $scope.changeTasks, true);
    //$scope.$watch('skip', $scope.changeTasks, true);
}]);

mp4Controllers.controller('AddTaskController', ['$scope', 'Tasks', 'Users', function($scope, Tasks, Users) {
    $scope.message = "";
    $('#alert').css("display", "none");
    $scope.task = {
        name: "",
        description: "",
        deadline: "",
        completed: false,
        assignedUserName: ""
    }
    $scope.selected = '';

    Users.getUsers().success(function(data){
        $scope.users = data.data.map(function(user){
            return user.name;
        });
        $scope.users.unshift('');
    });

    $scope.submitTask = function() {
        $scope.task.assignedUserName = $scope.selected;
        Tasks.postTasks($scope.task).success(function(data){
            $scope.message = data.message;
            $('#alert').css("display", "block");
        }).error(function(err){
            $scope.message = err.message;
            $('#alert').css("display", "block");
        });
    }

}]);

mp4Controllers.controller('SettingsController', ['$scope' , '$window' , function($scope, $window) {
    $scope.url = $window.sessionStorage.baseurl;
    $scope.displayText = "";
    $('#alert').css("display", "none");

    $scope.setUrl = function(){
        $window.sessionStorage.baseurl = $scope.url;
        $scope.displayText = "URL set";
        $('#alert').css("display", "block");
    };

}]);
