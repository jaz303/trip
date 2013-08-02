var MinHeap = require('min-heap');

function ObjectStorage() {
  this.open = new MinHeap(function(n1,n2) {
    return n1.__astar_f - n2.__astar_f;
  });
}

ObjectStorage.prototype = {
  reset: function(map) {
    this.open.clear();
    map.eachNode(function(node) {
      node.__astar_closed = false;
      node.__astar_parent = null;
      node.__astar_steps = 0;
      node.__astar_f = 0;
      node.__astar_g = 0;
      node.__astar_h = 0;
    });
  },

  hasOpenNodes: function() {
    return this.open.size > 0;
  },

  removeBestOpenNode: function() {
    return this.open.removeHead();
  },

  addToClosedSet: function(node) {
    node.__astar_closed = true;
  },

  addToOpenSet: function(node, g, h, parent) {
    if (parent) {
      node.__astar_parent = parent;
      node.__astar_steps = parent.__astar_steps + 1;
    } else {
      node.__astar_steps = 0;
    }
    node.__astar_f = g + h;
    node.__astar_g = g;
    node.__astar_h = h;
    this.open.insert(node);
  },

  isInOpenSet: function(node) {
    return this.open.contains(node);
  },

  isInClosedSet: function(node) {
    return node.__astar_closed;
  },

  g: function(node) {
    return node.__astar_g;
  },

  updateG: function(node, g, parent) {
    if (g < node.__astar_g) {
      this.open.remove(node);
      node.__astar_g = g;
      node.__astar_f = g + node.__astar_h;
      node.__astar_parent = parent;
      node.__astar_steps = parent.__astar_steps + 1;
      this.open.insert(node);
    }
  },

  resultTo: function(node, returnPath) {
    var result = {
      success : true,
      cost    : node.__astar_f,
      steps   : node.__astar_steps
    };

    if (returnPath) {
      var path = [];
      while (node) {
        path.unshift(node);
        node = node.__astar_parent;
      }
      result.path = path;
    } else {
      result.path = null;
    }

    return result;
  }
};

module.exports = ObjectStorage;