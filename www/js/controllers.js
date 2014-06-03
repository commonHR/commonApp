angular.module('starter.controllers', ['twitterLib', 'geolocation'])

.controller('AppCtrl', function($scope) {
})

.controller('LoginCtrl', ['$rootScope', '$scope', '$state', function($rootScope, $scope, $state) {
  $scope.doLogin = function(){
    $state.transitionTo('app.home');
  }
}])

.controller('MatchesCtrl', ['$rootScope', '$scope', function($rootScope, $scope) {
  $rootScope.matches = {
    marco: { screen_name: 'marco', title: 'Reggae', id: 1 },
    peter: { screen_name: 'peter', title: 'Chill', id: 2 },
    amy: { screen_name: 'amy', title: 'Dubstep', id: 3 },
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
