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
    doGetLocation();
  };

  $scope.doLogout = function(){
    TwitterLib.logout();
    $state.transitionTo('login');
  };

}])

.controller('MatchesCtrl', ['$rootScope', '$scope', '$http', function($rootScope, $scope, $http) {

  var search = function () {

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

  $scope.init = function(){
    alert('MatchesCtrl init');
    search();
  };

}])

.controller('MatchCtrl', ['$rootScope', '$scope', '$stateParams', function($rootScope, $scope, $stateParams) {
  
  var matchScreenName = $stateParams.screen_name;
  $scope.match = $rootScope.matches[matchScreenName];
  console.log($scope.match);

}])

.controller('ConversationsCtrl', ['$rootScope', '$scope', '$http', function($rootScope, $scope, $http) {

  // $rootScope.conversations = {
  //   marco: { screen_name: 'marco', title: 'Hello', id: 1 },
  //   peter: { screen_name: 'peter', title: 'This', id: 2 },
  //   amy: { screen_name: 'amy', title: 'Convo', id: 3 },
  // };

  var getMessages = function(){

    $http.post('http://127.0.0.1:4568/get_messages', {screen_name: $rootScope.userData.screen_name})
    .success(function(data){
      alert('getMessages success');
      $rootScope.conversations = data;
    })
    .error(function(data){
      alert('ERROR: ' + data);
    });
  };

  $scope.init = function(){
    getMessages();
  };


}])

.controller('ConversationCtrl', ['$rootScope', '$scope', '$http', '$stateParams', function($rootScope, $scope, $http, $stateParams) {

  var conversationScreenName = $stateParams.screen_name;
  $scope.conversation = $rootScope.conversations[conversationScreenName];
  console.log($scope.conversation);

  var sendMessage = function(){
    var text = $scope.newMessageText;
    alert('sendMessage: ' + text);
    // $http.post('http://127.0.0.1:4568/send_message', {
    //   sender: $rootScope.userData.screen_name,
    //   recipient: conversationScreenName,
    //   text: text
    // })
    // .success(function(data){
    //   alert('sendMessage success');
    // })
    // .error(function(data){
    //   alert('ERROR: ' + data);
    // });
  };

  $scope.doInputSendMessage = function(event){
    if(event.keyCode === 13){
      sendMessage();
    }
  };

  $scope.doButtonSendMessage = function(){
    sendMessage();
  };

}]);
