// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

    .state('login', {
      url: "/login",
      templateUrl: "templates/login.html",
      controller: 'LoginCtrl'
    })

    .state('app', {
      url: "/app",
      abstract: true,
      templateUrl: "templates/menu.html",
      controller: 'AppCtrl'
    })

    .state('app.home', {
      url: "/home",
      views: {
        'menuContent' :{
          templateUrl: "templates/home.html",
          controller: 'HomeCtrl'
        }
      }
    })

    .state('app.settings', {
      url: "/settings",
      views: {
        'menuContent' :{
          templateUrl: "templates/settings.html"
        }
      }
    })

    .state('app.matches', {
      url: "/matches",
      views: {
        'menuContent' :{
          templateUrl: "templates/matches.html",
          controller: 'MatchesCtrl'
        }
      }
    })

    .state('app.match', {
      url: "/match/:screen_name",
      views: {
        'menuContent' :{
          templateUrl: "templates/match.html",
          controller: 'MatchCtrl'
        }
      }
    })

    .state('app.conversations', {
      url: "/conversations",
      views: {
        'menuContent' :{
          templateUrl: "templates/conversations.html",
          controller: 'ConversationsCtrl'
        }
      }
    })

    .state('app.conversation', {
      url: "/conversation/:screen_name",
      views: {
        'menuContent' :{
          templateUrl: "templates/conversation.html",
          controller: 'ConversationCtrl'
        }
      }
    });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login');
});

