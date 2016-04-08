var app = angular.module('mp4', ['ngRoute', 'mp4Controllers', 'mp4Services', '720kb.datepicker']);

app.config(['$routeProvider', function($routeProvider) {
  $routeProvider.
    when('/users', {
    templateUrl: 'partials/userlist.html',
    controller: 'UserListController'
  }).
  when('/adduser', {
    templateUrl: 'partials/adduser.html',
    controller: 'AddUserController'
  }).
  when('/user/:userid', {
    templateUrl: 'partials/user.html',
    controller: 'UserController'
  }).
  when('/tasks', {
    templateUrl: 'partials/tasklist.html',
    controller: 'TaskListController'
  }).
  when('/task/:taskid', {
    templateUrl: 'partials/task.html',
    controller: 'TaskController'
  }).
  when('/edittask/:taskid', {
    templateUrl: 'partials/edittask.html',
    controller: 'EditTaskController'
  }).
  when('/addtask', {
    templateUrl: 'partials/addtask.html',
    controller: 'AddTaskController'
  }).
  when('/settings', {
    templateUrl: 'partials/settings.html',
    controller: 'SettingsController'
  }).
  otherwise({
    redirectTo: '/settings'
  });
}]);
