var SimpleStorage = require('./simple_storage'),
    ObjectStorage = require('./object_storage');

var storageFactory = {
  'simple'  : SimpleStorage,
  'object'  : ObjectStorage
};

function create(map, options) {

  options = options || {};

  var storage = options.storage || SimpleStorage;
  if (typeof storage === 'string') {
    storage = new storageFactory[storage]();
  }

  var h = options.heuristic;
  if (!h) {
    throw "A-star requires a heuristic function";
  }

  var d = options.distance;
  if (!d) {
    throw "A-star requires a distance function";
  }

  var eachNeighbour = options.eachNeighbour;
  if (!eachNeighbour) {
    throw "A-star requires a neighbour iterator";
  }

  var eq = options.nodeCompare || function(l, r) { return l === r; };

  function doAStar(startNode, goalNode, returnPath) {

    storage.reset();
    storage.addToOpenSet(startNode, 0.0, h(startNode, goalNode), null);

    while (storage.hasOpenNodes()) {
      var currNode = storage.removeBestOpenNode();
      if (eq(currNode, goalNode)) {
        return storage.resultTo(goalNode, returnPath);
      } else {
        storage.addToClosedSet(currNode);
        eachNeighbour(currNode, function(neighbour, ix) {
          if (storage.isInClosedSet(neighbour)) {
            return;
          }
          var gScore = storage.g(currNode) + distance(currNode, neighbour, ix);
          if (!storage.isInOpenSet(neighbour)) {
            storage.addToOpenSet(neighbour, gScore, h(neighbour, goal), currNode);
          } else {
            storage.updateG(neighbour, gScore, curr);
          }
        });
      }
    }

    return {
      success   : false,
      cost      : Infinity,
      path      : returnPath ? [] : null
    };

  }

  return {
    calculate : function(start, goal) { return doAStar(start, goal, true); },
    cost      : function(start, goal) { return doAStar(start, goal, false).cost; },
    path      : function(start, goal) { return doAStar(start, goal, true).path; }
  };

}

exports.create = create;