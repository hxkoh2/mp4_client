var mp4Services = angular.module('mp4Services', []);

mp4Services.factory('Users', function($http, $window) {
    return {
        getUsers : function() {
            var baseUrl = $window.sessionStorage.baseurl;
            return $http.get(baseUrl+'/api/users');
        },
        postUsers : function(user) {
            var baseUrl = $window.sessionStorage.baseurl;
            return $http({
                method: 'POST',
                url: baseUrl + '/api/users',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                data: user
            });
        },
        query : function (query) {
            var baseUrl = $window.sessionStorage.baseurl;
            return $http.get(baseUrl+'/api/users?'+query);
        },
        getUser : function(userid) {
            var baseUrl = $window.sessionStorage.baseurl;
            return $http.get(baseUrl+'/api/users/'+userid);
        },
        deleteUser : function(userid) {
            var baseUrl = $window.sessionStorage.baseurl;
            return $http.delete(baseUrl+'/api/users/'+userid)
            .success(function(user){
                $http.get(baseUrl + '/api/tasks?where={"assignedUser":"'+userid + '"}').success(function(data){
                    var tasks = data.data;
                    for(t in tasks){
                        var taskid = tasks[t]._id;
                        $http.get(baseUrl+'/api/tasks/'+taskid)
                        .success(function(task){
                            task.data.assignedUserName = 'unassigned';
                            $http({
                                method: 'PUT',
                                url: baseUrl+'/api/tasks/'+task.data._id, 
                                data: $.param(task.data),
                                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                            });
                        });
                    }
                });
            })
        }
    }
});

mp4Services.factory('Tasks', function($http, $window) {
    return {
        getTasks : function() {
            var baseUrl = $window.sessionStorage.baseurl;
            return $http.get(baseUrl+'/api/tasks');
        },
        postTasks : function(task) {
            var baseUrl = $window.sessionStorage.baseurl;
            return $http({
                method: 'POST',
                url: baseUrl + '/api/tasks',
                data: $.param(task),
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).success(function(data){
                var newtask = data.data;
                if(newtask.assignedUser) {
                    $http.get(baseUrl + '/api/users/' + newtask.assignedUser).success(function(data2){
                        var user = data2.data;
                        user.pendingTasks.push(newtask._id);
                        $http({
                            method: 'PUT',
                            url: baseUrl + '/api/users/' + newtask.assignedUser,
                            data: $.param(user),
                            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                        });
                    });
                }
            });
        },
        query : function (query) {
            var baseUrl = $window.sessionStorage.baseurl;
            return $http.get(baseUrl+'/api/tasks?'+query);
        },
        getTask : function(taskid) {
            var baseUrl = $window.sessionStorage.baseurl;
            return $http.get(baseUrl+'/api/tasks/'+taskid);
        },
        deleteTask : function(taskid) {
            var baseUrl = $window.sessionStorage.baseurl;
            return $http.delete(baseUrl+'/api/tasks/'+taskid)
            .success(function(data){
                var task = data.data;
                var assignedUser = task.assignedUser;
                if(assignedUser){
                    $http.get(baseUrl + '/api/users/' + assignedUser).success(function(data2){
                        var user = data2.data;
                        var idx = user.pendingTasks.indexOf(taskid);
                        user.pendingTasks.splice(idx, 1);
                        $http({
                            method: 'PUT',
                            url: baseUrl + '/api/users/' + assignedUser,
                            data: $.param(user),
                            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                        });
                    });
                }
            });
        },
        putTask : function(taskid, task, originalTask) {
            var baseUrl = $window.sessionStorage.baseurl;
            return $http({
                method: 'PUT',
                url: baseUrl + '/api/tasks/' + taskid,
                data: $.param(task),
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).success(function(task2){
                var originalUser = originalTask.assignedUser;
                if (originalUser && (originalTask.completed === false)) { //need to remove from original user
                    $http.get(baseUrl + '/api/users/' + originalUser).success(function(data){
                        var user = data.data;
                        var idx = user.pendingTasks.indexOf(taskid);
                        user.pendingTasks.splice(idx,1);
                        $http({
                            method: 'PUT',
                            url: baseUrl + '/api/users/' + originalUser, 
                            data: $.param(user),
                            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                        }).success(function(data2){
                            if(task2.data.assignedUser && (task2.data.completed === false)) {
                                $http.get(baseUrl + '/api/users/' + task2.data.assignedUser).success(function(data3){
                                    var newuser = data3.data;
                                    newuser.pendingTasks.push(taskid);
                                    $http({
                                        method: 'PUT',
                                        url: baseUrl+'/api/users/' + task2.data.assignedUser, 
                                        data: $.param(newuser),
                                        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                                    });
                                });
                            }
                        });
                    });
                }
                else {
                    if(task2.data.assignedUser && (task2.data.completed === false)) {
                        $http.get(baseUrl + '/api/users/' + task2.data.assignedUser).success(function(data3){
                            var newuser = data3.data;
                            newuser.pendingTasks.push(taskid);
                            $http({
                                method: 'PUT',
                                url: baseUrl+'/api/users/' + task2.data.assignedUser, 
                                data: $.param(newuser),
                                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                            });
                        });
                    }
                }
            });
        }
    }
});

