angular.module('starter.controllers', ['twitterLib', 'geolocation'])

.constant('AppConfig', {
  url: 'http://tweet-up.herokuapp.com/',
  // url: 'http://127.0.0.1:4568/'
})

.controller('AppCtrl', ['$rootScope', '$scope', '$state', 'TwitterLib', function($rootScope, $scope, $state, TwitterLib) {
  $scope.doLogout = function(){
    TwitterLib.logout();
    //clear all $rootScope variables
    delete $rootScope.userData;
    delete $rootScope.matches;
    delete $rootScope.conversations;
    delete $rootScope.conversationsArray;
    delete $rootScope.maxDistance;
    delete $rootScope.maxTime;

    $state.go('login');
  };
}])

.controller('LoginCtrl', ['$rootScope', '$scope', '$http', '$state', 'geolocation', 'TwitterLib', 'AppConfig', function($rootScope, $scope, $http, $state, geolocation, TwitterLib, AppConfig) {

  var getLocation = function(){
    alert('getLocation');
    geolocation.getLocation().then(function(data){
      $rootScope.coords = {latitude: data.coords.latitude.toString(), longitude: data.coords.longitude.toString()};
      alert('geo success');
    }).error(function(data){
      alert('geo ERROR: ' + data);
    });
  };

  var appLogin = function(){
    $http.post(AppConfig.url + 'login', {
      screen_name: $rootScope.userData.screen_name
    })
    .success(function(data){
      console.log('login success');
      getLocation();
    })
    .error(function(data){
      alert('login ERROR: ' + data);
    });
  };

  var getConversations = function(){

    $http.post(AppConfig.url + 'get_messages', {screen_name: $rootScope.userData.screen_name})
    .success(function(data){

      var messagesCount = 0;
      $rootScope.conversations = data;
      $rootScope.conversationsArray = [];
      for(var key in $rootScope.conversations){
        $rootScope.conversationsArray.push($rootScope.conversations[key]);
        messagesCount += $rootScope.conversations[key].messages.length;
      }

      $rootScope.connectionsCount = $rootScope.conversationsArray.length;
      $rootScope.messagesCount = messagesCount;

      $scope.loading = false;

    })
    .error(function(data){
      alert('ERROR: ' + data);
    });
  };

  $scope.doLogin = function(){
    TwitterLib.init().then(function(_data) {
      appLogin();
      getConversations();

      $rootScope.maxDistance = 8000;
      $rootScope.maxTime = 8000;

      $state.go('app.home');
    });
  };

}])

.controller('HomeCtrl', ['$rootScope', '$scope', '$state', '$http', 'TwitterLib', 'AppConfig', function($rootScope, $scope, $state, $http, TwitterLib, AppConfig){

  $scope.doGoToSearch = function(){
    $state.go('app.matches');
  };

  $scope.doGoToConversations = function(){
    $state.go('app.conversations');
  };

  $scope.doLogout = function(){
    TwitterLib.logout();

    //clear all $rootScope variables
    delete $rootScope.userData;
    delete $rootScope.matches;
    delete $rootScope.conversations;
    delete $rootScope.conversationsArray;
    delete $rootScope.maxDistance;
    delete $rootScope.maxTime;

    $state.go('login');
  };

}])

.controller('MatchesCtrl', ['$rootScope', '$scope', '$http', 'AppConfig', function($rootScope, $scope, $http, AppConfig) {

  $scope.loading = false;

  $scope.search = function () {

    $scope.loading = true;

    $http.post(AppConfig.url + 'search', {
      screen_name: $rootScope.userData.screen_name,
      current_location: JSON.stringify($rootScope.coords),
      max_distance: $rootScope.maxDistance,
      max_time: $rootScope.maxTime
    })
    .success(function(data){
      $rootScope.matches = data;
    })
    .error(function(data){
      alert('ERROR: ' + data);
    })
    .finally(function() {
      $scope.loading = false;
      // Stop the ion-refresher from spinning
      $scope.$broadcast('scroll.refreshComplete');
    });
  };
  
  //on load
  if(!$rootScope.matches) {
    $scope.search();
  }

}])

.controller('MatchCtrl', ['$rootScope', '$scope', '$http', '$state', '$stateParams', 'AppConfig', function($rootScope, $scope, $http, $state, $stateParams, AppConfig) {
  
  var matchScreenName = $stateParams.screen_name;
  $scope.match = $rootScope.matches[matchScreenName];
  // alert($scope.match.common_words);
  $scope.connectBox = false;

  var sendMessage = function(newMessageText){
    var sender = $rootScope.userData.screen_name;

    $http.post(AppConfig.url + 'send_message', {message: {
      sender: sender,
      recipient: matchScreenName,
      text: newMessageText
    }})
    .success(function(data){
      console.log('sendMessage success');
    })
    .error(function(data){
      alert('ERROR: ' + data);
    });
  };

  $scope.doConnect = function(){
    $scope.connectBox = true;
  };

  $scope.closeConnect = function(){
    $scope.connectBox = false;
  };

  $scope.doButtonSendMessage = function(newMessageText){
    sendMessage(newMessageText);
    $scope.connectBox = false;
  };

}])

.controller('ConversationsCtrl', ['$rootScope', '$scope', '$http', '$interval' ,'AppConfig', function($rootScope, $scope, $http, $interval, AppConfig) {

  var getConversations = function(){

    $http.post(AppConfig.url + 'get_messages', {screen_name: $rootScope.userData.screen_name})
    .success(function(data){

      var messagesCount = 0;
      $rootScope.conversations = data;
      $rootScope.conversationsArray = [];
      for(var key in $rootScope.conversations){
        $rootScope.conversationsArray.push($rootScope.conversations[key]);
        messagesCount += $rootScope.conversations[key].messages.length;
      }

      $rootScope.connectionsCount = $rootScope.conversationsArray.length;
      $rootScope.messagesCount = messagesCount;

      $scope.loading = false;
    })
    .error(function(data){
      alert('ERROR: ' + data);
    });
  };

  $scope.$on('$destroy', function(event){
    $interval.cancel($scope.getConversationsInterval);
  });
  
  //on load
  if(!$rootScope.conversations){
    $scope.loading = true;
  }
  getConversations();
  $scope.getConversationsInterval = $interval(function(){
    getConversations();
  }, 10000);

}])

.controller('ConversationCtrl', ['$rootScope', '$scope', '$http', '$stateParams', '$interval', '$ionicScrollDelegate', 'AppConfig', function($rootScope, $scope, $http, $stateParams, $interval, $ionicScrollDelegate, AppConfig) {

  var conversationScreenName = $stateParams.screen_name;
  $scope.match = $rootScope.conversations[conversationScreenName].match;


  $scope.scrollToBottom = function(){
    $ionicScrollDelegate.scrollBottom();    
  };

  //listen to changes in length of $scope.messages; scroll to bottom for new messages
  $scope.$watch(function(){
    return $scope.messages.length;
  }, function(newV, oldV){
    $scope.scrollToBottom();
  });

  var getConversation = function(){

    var user = $rootScope.userData.screen_name;
    var match = conversationScreenName;

    $http.post(AppConfig.url + 'get_conversation', {
      user: user,
      match: match,
    })
    .success(function(data){
      $scope.messages = data.slice().reverse();
    })
    .error(function(data){
      alert('ERROR: ' + data);
    });
  };

  var sendMessage = function(newMessageText){

    var sender = $rootScope.userData.screen_name;

    $http.post(AppConfig.url + 'send_message', {
      message: {
        sender: sender,
        recipient: conversationScreenName,
        text: newMessageText
      }
    })
    .success(function(data){
      getConversation();
    })
    .error(function(data){
      alert('ERROR: ' + data);
    });
  };

  $scope.$on('$destroy', function(event){
    $interval.cancel($scope.getConversationInterval);
  });

  //on load
  getConversation();

  $scope.getConversationInterval = $interval(function(){
    getConversation();
  }, 1000);

  $scope.doInputSendMessage = function(event, newMessageText){
    if(event.keyCode === 13){
      sendMessage(newMessageText);
    }
    $scope.newMessageText = '';
  };

  $scope.doButtonSendMessage = function(newMessageText){
    sendMessage(newMessageText);
    $scope.newMessageText = '';
  };

}])
.controller('SettingsCtrl', ['$rootScope', '$scope', '$http', '$state', '$stateParams', '$interval', function($rootScope, $scope, $http, $state, $stateParams, $interval) {

  $scope.doSaveSettings = function(){
    $rootScope.maxDistance = $scope.settings.newMaxDistance;
    $rootScope.maxTime = $scope.settings.newMaxTime;
    $state.go('app.home');
  };
  //on load
  $scope.settings = {
    newMaxDistance: $rootScope.maxDistance,
    newMaxTime: $rootScope.maxTime
  };
  
}]);
