angular.module('starter.controllers', ['twitterLib', 'geolocation'])

.controller('AppCtrl', function($scope) {
})

.controller('LoginCtrl', ['$rootScope', '$scope', '$state', 'TwitterLib', function($rootScope, $scope, $state, TwitterLib) {

  $scope.doLogin = function(){
    TwitterLib.init().then(function(_data) {
      $state.transitionTo('app.home');
    });

    // $state.transitionTo('app.home');
  };

}])

.controller('HomeCtrl', ['$rootScope', '$scope', '$state', '$http', 'TwitterLib', 'geolocation', function($rootScope, $scope, $state, $http, TwitterLib, geolocation){

  var doGetLocation = function(){
    geolocation.getLocation().then(function(data){
      alert('geo success');
      $rootScope.coords = {latitude: data.coords.latitude.toString(), longitude: data.coords.longitude.toString()};
      // alert(JSON.stringify($rootScope.coords));
    }).error(function(data){
      alert('geo ERROR: ' + data);
    });
  };

  $scope.init = function() {
    alert('here');
    doGetLocation();
  };

  $scope.doLogout = function(){
    TwitterLib.logout();
    $state.transitionTo('login');
  };

}])

.controller('MatchesCtrl', ['$rootScope', '$scope', function($rootScope, $scope) {

  // $rootScope.matches = {
  //   marco: { screen_name: 'marco', title: 'Reggae', id: 1 },
  //   peter: { screen_name: 'peter', title: 'Chill', id: 2 },
  //   amy: { screen_name: 'amy', title: 'Dubstep', id: 3 },
  // };

  var search = function () {

    alert($rootScope.coords);

    $http.post('http://127.0.0.1:4568/search', {
      screen_name: $rootScope.userData.screen_name,
      location: JSON.stringify($rootScope.coords)
    })
    .success(function(data){
      $rootScope.matches = data;
      alert('search success');
    })
    .error(function(data){
      alert('ERROR: ' + data);
    });
  };



}])

.controller('MatchCtrl', ['$rootScope', '$scope', '$stateParams', function($rootScope, $scope, $stateParams) {
  
  var matchScreenName = $stateParams.screen_name;
  $scope.match = $rootScope.matches[matchScreenName];
  console.log($scope.match);

}])

.controller('ConversationsCtrl', ['$rootScope', '$scope', function($rootScope, $scope) {

  $rootScope.conversations = {
    marco: { screen_name: 'marco', title: 'Hello', id: 1 },
    peter: { screen_name: 'peter', title: 'This', id: 2 },
    amy: { screen_name: 'amy', title: 'Convo', id: 3 },
  };

}])

.controller('ConversationCtrl', ['$rootScope', '$scope', '$stateParams', function($rootScope, $scope, $stateParams) {

  var conversationScreenName = $stateParams.screen_name;
  $scope.conversation = $rootScope.conversations[conversationScreenName];
  console.log($scope.conversation);

}]);
