/**
 * Copyright reelyActive 2017
 * We believe in an open Internet of Things
 */


// Add new scenes here and they will be presented on the webpage
const SCENES = [
  { name: "Square Shades", url: "scenes/squareshades/" }
];


/**
 * generable Module
 */
angular.module('generable', [ 'ui.bootstrap' ])

  // Display controller
  .controller('DisplayCtrl', function($scope) {
    $scope.scenes = SCENES;
    $scope.selectedScene = SCENES[0].name;
  });
