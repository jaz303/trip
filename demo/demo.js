var trip      = require('../'),
    GridWorld = require('gridworld');

var canvas = null,
    world  = null;

function init() {

  canvas = document.getElementById('canvas');

  world = new GridWorld(canvas, 20, 20, {
    resizeCanvas: true,
    drawBorder: true
  });

  world.draw();

}

window.init = init;