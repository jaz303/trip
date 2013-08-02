var SimpleStorage = require('./simple_storage'),
    ObjectStorage = require('./object_storage');

var storageFactory = {
  'simple'  : SimpleStorage,
  'object'  : ObjectStorage
};

function create(map, options) {

  options = options || {};

  var storage = options.storage || new SimpleStorage();
  if (typeof storage === 'string') {
    storage = new storageFactory[storage]();
  }

  var h = options.heuristic;
  if (!h) {
    throw "A-star requires a heuristic function";
  }

  function doAStar(startNode, goalNode, returnPath) {

    storage.reset(map);
    storage.addToOpenSet(startNode, 0.0, h(startNode, goalNode), null);

    while (storage.hasOpenNodes()) {
      var currNode = storage.removeBestOpenNode();
      if (map.compare(currNode, goalNode)) {
        return storage.resultTo(goalNode, returnPath);
      } else {
        storage.addToClosedSet(currNode);
        map.eachNeighbour(currNode, function(neighbour, ix) {
          if (storage.isInClosedSet(neighbour)) {
            return;
          }
          var gScore = storage.g(currNode) + map.distance(currNode, neighbour, ix);
          if (!storage.isInOpenSet(neighbour)) {
            storage.addToOpenSet(neighbour, gScore, h(neighbour, goalNode), currNode);
          } else {
            storage.updateG(neighbour, gScore, currNode);
          }
        });
      }
    }

    return {
      success   : false,
      cost      : Infinity,
      path      : null
    };

  }

  return {
    calculate : function(start, goal) { return doAStar(start, goal, true); },
    cost      : function(start, goal) { return doAStar(start, goal, false).cost; },
    path      : function(start, goal) { return doAStar(start, goal, true).path; }
  };

}

exports.create = create;
exports.SimpleStorage = SimpleStorage;
exports.ObjectStorage = ObjectStorage;