var MinHeap = require('min-heap');

function ObjectStorage() {
  this.open = new MinHeap(function(node) { return node.cost; });
}

ObjectStorage.prototype = {
  reset: function(map) {
    this.open.clear();
    map.eachNode(function(node) {
      node.__astar_closed = false;
      node.__astar_parent = null;
      node.__astar_g = null;
    });
  },

  hasOpenNodes: function() {
    return !this.open.isEmpty();
  },

  removeBestOpenNode: function() {
    return this.open.remove().node;
  },

  addToClosedSet: function(node) {
    node.__astar_closed = true;
  },

  addToOpenSet: function(node, g, h, parent) {

  },

  isInClosedSet: function(node) {
    return node.__astar_closed;
  },

  g: function(node) {
    return node.__astar_g;
  },

  updateG: function(node, g, parent) {
    if (g < node.__astar_g) {
      node.__astar_g = g;
      node.__astar_parent = parent;
    }
  },

  resultTo: function(node, returnPath) {
    var cost = 0;
    
    if (returnPath) {
      var path = [];
      while (node) {
        path.unshift(node);
        cost += node.__astar_h;
        node = node.__astar_parent;
      }
    } else {
      var path = null;
      while (node) {
        cost += node.__astar_h;
        node = node.__astar_parent;
      }
    }

    return {
      success : true,
      cost    : cost,
      path    : path
    };
  }
};

module.exports = ObjectStorage;