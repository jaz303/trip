var trip      = require('../'),
    GridWorld = require('gridworld');

var canvas = null,
    world  = null;

function init() {

  canvas = document.getElementById('canvas');

  world = new GridWorld(canvas, 20, 15, {
    resizeCanvas: true,
    drawBorder: true
  });

  world.draw();

  // Map representation for gridworld
  var map = {
    eachNode      : world.eachNode.bind(world),
    eachNeighbour : world.eachNodeNeighbour.bind(world),
    compare       : function(n1,n2) { return n1 === n2; },
    distance      : function(from,to) { return 1; }
  };

  // Engines
  var astar = trip.create('astar', map, {
    storage: 'object',
    heuristic: function(n1,n2) {
      return Math.abs(n2.x-n1.x) + Math.abs(n2.y-n1.y);
    }
  });

  var start = null;

  world.onclick = function(node) {
    if (!start) {
      start = node;
    } else {
      var result = astar.calculate(start, node);
      console.log("result:", result);
      start = null;
    }
  }

}

window.init = init;