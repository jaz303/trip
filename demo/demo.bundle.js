;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
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
},{"../":2,"gridworld":6}],2:[function(require,module,exports){
var trip = {
  astar: require('./lib/astar'),

  create: function(algorithm, map, options) {
    return trip[algorithm].create(map, options);
  }
}

module.exports = trip;
},{"./lib/astar":3}],3:[function(require,module,exports){
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
},{"./object_storage":4,"./simple_storage":5}],4:[function(require,module,exports){
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
},{"min-heap":7}],5:[function(require,module,exports){
function SimpleStorage() {
  
}

module.exports = SimpleStorage;
},{}],6:[function(require,module,exports){
function _n(val, def) {
  return (typeof val === 'number') ? val : def;
}

var floor = Math.floor;

function Node(x, y, backgroundColor) {
  this.x = x;
  this.y = y;
  this.backgroundColor = backgroundColor || null;
  this.blocked = false;
}

Node.prototype = {
  toString: function() {
    return "<node x=" + this.x + " y=" + this.y + " blocked=" + this.blocked + ">";
  }
}

function GridWorld(canvas, width, height, options) {

  options = options || {};

  this.canvas  = canvas;
  this.ctx     = canvas.getContext('2d');
  this.width   = floor(width);
  this.height  = floor(height);

  var padding = options.padding;
  
  if (typeof padding === 'undefined') {
    padding = 0;
  }
  
  if (typeof padding === 'number') {
    this.padding = {
      top     : padding,
      right   : padding,
      bottom  : padding,
      left    : padding
    };
  } else {
    this.padding = padding;
  }

  this.cellSize = _n(options.cellSize, 32);
  this.cellSpacing = _n(options.cellSpacing, 1);
  this.drawBorder = !!options.drawBorder;
  this.borderColor = options.borderColor || 'black';
  this.backgroundColor = options.backgroundColor || 'white';

  if (options.resizeCanvas) {
    var cw = this.padding.left + this.padding.right,
        ch = this.padding.top + this.padding.bottom;

    cw += (this.width * (this.cellSize + this.cellSpacing)) - this.cellSpacing;
    ch += (this.height * (this.cellSize + this.cellSpacing)) - this.cellSpacing;

    if (this.drawBorder) {
      cw += (this.cellSpacing * 2);
      ch += (this.cellSpacing * 2);
    }

    this.canvas.width = cw;
    this.canvas.height = ch;
  }

  this.nodes = [];
  for (var j = 0; j < this.height; ++j) {
    for (var i = 0; i < this.width; ++i) {
      this.nodes.push(new Node(i, j, null));
    }
  }

  //
  // Event handling
  // TODO: support dragging

  var self = this;

  this.onclick = options.onclick;

  function p2n(x, y) {
    
    x -= self.padding.left;
    y -= self.padding.top;
    
    if (self.drawBorder) {
      x -= (self.cellSpacing * 2);
      y -= (self.cellSpacing * 2);
    }

    x = floor(x / (self.cellSize + self.cellSpacing));
    y = floor(y / (self.cellSize + self.cellSpacing));

    if (x >= 0 && x < self.width && y >= 0 && y < self.height) {
      return self.nodes[(y * self.width) + x];
    } else {
      return null;
    }
  }

  canvas.addEventListener('click', function(evt) {
    
    if (!self.onclick)
      return;
    
    var node = p2n(evt.offsetX, evt.offsetY);
    
    if (node)
      self.onclick(node);
  
  });

}

GridWorld.prototype = {
  draw: function() {

    var csz   = this.cellSize,
        csp   = this.cellSpacing
        ctx   = this.ctx,
        w     = this.width,
        h     = this.height,
        ix    = 0;

    var badj  = this.drawBorder ? this.cellSpacing : -this.cellSpacing,
        cadj  = this.drawBorder ? this.cellSpacing : 0;

    ctx.save();

    ctx.fillStyle = this.borderColor;
    ctx.fillRect(this.padding.left,
                 this.padding.top,
                 ((csz + csp) * this.width) + badj,
                 ((csz + csp) * this.height) + badj);

    var cy = this.padding.top + cadj;
    for (var j = 0; j < this.height; ++j) {
      var cx = this.padding.left + cadj;
      for (var i = 0; i < this.width; ++i) {
        var n = this.nodes[ix++];
        ctx.fillStyle = n.backgroundColor || this.backgroundColor;
        ctx.fillRect(cx, cy, csz, csz);
        cx += csz + csp;
      }
      cy += csz + csp;
    }

    ctx.restore();

  },

  setBackgroundColor: function(x, y, color) {
    this.nodes[(y * this.width) + x].backgroundColor = color || null;
  },

  setBlocked: function(x, y, blocked) {
    this.nodes[(y * this.width) + x].blocked = !!blocked;
  },

  setAttribute: function(x, y, key, value) {
    this.nodes[(y * this.width) + x][key] = value;
  },

  eachNeighbour: function(x, y, callback) {
    return this.eachNodeNeighbour(this.nodes[(y * this.width) + x], callback);
  },

  eachNodeNeighbour: function(node, callback) {

    var x   = node.x,
        y   = node.y,
        w   = this.width,
        h   = this.height,
        ns  = this.nodes,
        ix  = (y * w) + x,
        nix = 0;

    if (x > 0   && !ns[ix-1].blocked) callback(ns[ix-1], nix++);
    if (x < w-1 && !ns[ix+1].blocked) callback(ns[ix+1], nix++);
    if (y > 0   && !ns[ix-w].blocked) callback(ns[ix-w], nix++);
    if (y < h-1 && !ns[ix+w].blocked) callback(ns[ix+w], nix++);
  
  },

  eachNode: function(callback) {
    this.nodes.forEach(callback);
  }

};

module.exports = GridWorld;
},{}],7:[function(require,module,exports){
function CMP(l,r) { return l-r; }

function MinHeap(scoreFn) {
  this.cmp = scoreFn || CMP;
  this.heap = [];
  this.size = 0;
}

MinHeap.prototype = {

  clear: function() {
    this.heap.length = 0;
    this.size = 0;
  },

  contains: function(item) {
    var heap = this.heap;
    for (var i = 0, sz = this.size; i < sz; ++i) {
      if (heap[i] === item)
        return true;
    }
    return false;
  },
  
  insert: function(item) {
    
    var heap  = this.heap,
        ix    = this.size++;
        
    heap[ix] = item;
    
    var parent = (ix-1)>>1;
    
    while ((ix > 0) && this.cmp(heap[parent], item) > 0) {
      var tmp = heap[parent];
      heap[parent] = heap[ix];
      heap[ix] = tmp;
      ix = parent;
      parent = (ix-1)>>1;
    }
        
  },
  
  removeHead: function() {
    
    var heap  = this.heap,
        cmp   = this.cmp;
    
    if (this.size === 0)
      return undefined;
      
    var out = heap[0];
    
    this._bubble(0);
    
    return out;
    
  },

  remove: function(item) {

    var heap = this.heap;

    for (var i = 0; i < this.size; ++i) {
      if (heap[i] === item) {
        this._bubble(i);
        return true;
      }
    }

    return false;

  },

  _bubble: function(ix) {

    var heap  = this.heap,
        cmp   = this.cmp;

    heap[ix] = heap[--this.size];
    heap[this.size] = null;

    while (true) {
      
      var leftIx  = (ix<<1)+1,
          rightIx = (ix<<1)+2,
          minIx   = ix;
      
      if (leftIx < this.size && cmp(heap[leftIx], heap[minIx]) < 0) {
        minIx = leftIx;
      }
      
      if (rightIx < this.size && cmp(heap[rightIx], heap[minIx]) < 0) {
        minIx = rightIx;
      }
      
      if (minIx !== ix) {
        var tmp = heap[ix];
        heap[ix] = heap[minIx];
        heap[minIx] = tmp;
        ix = minIx;
      } else {
        break;
      }
      
    }

  }

};

module.exports = MinHeap;
},{}]},{},[1])
;