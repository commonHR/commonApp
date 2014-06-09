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

    $state.transitionTo('login');
  };
}])

.controller('LoginCtrl', ['$rootScope', '$scope', '$http', '$state', 'TwitterLib', 'AppConfig', function($rootScope, $scope, $http, $state, TwitterLib, AppConfig) {

  var appLogin = function(){
    // $http.post('http://127.0.0.1:4568/login', {
    $http.post(AppConfig.url + 'login', {
      screen_name: $rootScope.userData.screen_name
    })
    .success(function(data){
      // alert('login success');
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

      $state.transitionTo('app.home');
    });
  };

}])

.controller('HomeCtrl', ['$rootScope', '$scope', '$state', '$http', 'TwitterLib', 'geolocation', 'AppConfig', function($rootScope, $scope, $state, $http, TwitterLib, geolocation, AppConfig){

  var doGetLocation = function(){
    // alert('doGetLocation');
    geolocation.getLocation().then(function(data){
      // alert('geo success');
      $rootScope.coords = {latitude: data.coords.latitude.toString(), longitude: data.coords.longitude.toString()};
      // getConversations();
      // alert(JSON.stringify($rootScope.coords));
    }).error(function(data){
      alert('geo ERROR: ' + data);
    });
  };

  $scope.init = function() {
    doGetLocation();
  };

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

    $state.transitionTo('login');
  };

}])

.controller('MatchesCtrl', ['$rootScope', '$scope', '$http', 'AppConfig', function($rootScope, $scope, $http, AppConfig) {

  $scope.loading = false;

  $scope.search = function () {

    $scope.loading = true;

    // $http.post('http://127.0.0.1:4568/search', {
    $http.post(AppConfig.url + 'search', {
      screen_name: $rootScope.userData.screen_name,
      current_location: JSON.stringify($rootScope.coords),
      max_distance: $rootScope.maxDistance,
      max_time: $rootScope.maxTime
    })
    .success(function(data){
      $rootScope.matches = data;
      // alert('search success');
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

  $scope.init = function(){
    if(!$rootScope.matches) {
      $scope.search();
    }
  };

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
      // alert('sendMessage success');
    })
    .error(function(data){
      alert('ERROR: ' + data);
    });
  };

  $scope.doConnect = function(){
    // $state.go('app.connect', {screen_name: matchScreenName});
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

.controller('ConnectCtrl', ['$rootScope', '$scope', '$stateParams', function($rootScope, $scope, $stateParams) {
  
  var matchScreenName = $stateParams.screen_name;
  $scope.match = $rootScope.matches[matchScreenName];
  console.log($scope.match);

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


  $scope.init = function(){
    if(!$rootScope.conversations){
      $scope.loading = true;
    }
    getConversations();
    $scope.getConversationsInterval = $interval(function(){
      // alert('$interval');
      getConversations();
    }, 10000);
  };

  $scope.$on('$destroy', function(event){
    // alert('leave conversations');
    $interval.cancel($scope.getConversationsInterval);
  });

}])

.controller('ConversationCtrl', ['$rootScope', '$scope', '$http', '$stateParams', '$interval', '$ionicScrollDelegate', 'AppConfig', function($rootScope, $scope, $http, $stateParams, $interval, $ionicScrollDelegate, AppConfig) {

  var conversationScreenName = $stateParams.screen_name;
  $scope.match = $rootScope.conversations[conversationScreenName].match;


  $scope.scrollToBottom = function(){
    $ionicScrollDelegate.scrollBottom();    
  };

  //listen to changes in length of $scope.messages
  $scope.$watch(function(){
    return $scope.messages.length;
  }, function(newV, oldV){
    // alert('messages changed');
    $scope.scrollToBottom();
  });

  var getConversation = function(){

    // alert('getConversation');

    var user = $rootScope.userData.screen_name;
    var match = conversationScreenName;

    $http.post(AppConfig.url + 'get_conversation', {
      user: user,
      match: match,
    })
    .success(function(data){
      $scope.messages = data.slice().reverse();

      //speed up yellow color-off
      // for(var i = 0; i < $rootScope.conversationsArray.length; i++){
      //   // if($rootScope.conversationsArray[i].read_status[$rootScope.userData.screen_name)
      // }
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
      // alert('sendMessage success');
    })
    .error(function(data){
      alert('ERROR: ' + data);
    });
  };

  $scope.init = function(){
    getConversation();

    $scope.getConversationInterval = $interval(function(){
      // alert('$interval');
      getConversation();
    }, 1000);
  };
  
  $scope.$on('$destroy', function(event){
    $interval.cancel($scope.getConversationInterval);
  });

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

  $scope.init = function(){
    $scope.settings = {
      newMaxDistance: $rootScope.maxDistance,
      newMaxTime: $rootScope.maxTime
    };
  };

  // $scope.$watch('settings.newMaxTime', function(){
  //   alert('changed!');
  // });

  $scope.doSaveSettings = function(){
    // alert('doSaveSettings');
    // alert('newMaxTime: ' + newMaxTime);
    $rootScope.maxDistance = $scope.settings.newMaxDistance;
    $rootScope.maxTime = $scope.settings.newMaxTime;
    $state.go('app.home');
    // alert('maxTime: ' + $rootScope.maxTime);
  };

}]);
