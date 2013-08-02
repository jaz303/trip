;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
var routemaster = require('../'),
    gridworld   = require('gridworld');

window.init = function(canvas) {
  console.log(canvas);
}
},{"../":2,"gridworld":6}],2:[function(require,module,exports){
var alg = {
  astar : require('./lib/astar')
};

module.exports = {
	alg: alg,

  create: function(algorithm, map, options) {
    return alg[algorithm].create(map, options);
  }
};

},{"./lib/astar":3}],3:[function(require,module,exports){
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
},{"./object_storage":4,"./simple_storage":5}],4:[function(require,module,exports){
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
    
    console.log

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
    
    var w   = this.width,
        h   = this.height,
        ns  = this.nodes,
        ix  = (y * w) + x;

    if (x > 0   && !ns[ix-1].blocked) callback(x-1, y);
    if (x < w-1 && !ns[ix+1].blocked) callback(x+1, y);
    if (y > 0   && !ns[ix-w].blocked) callback(x, y-1);
    if (y < h-1 && !ns[ix+w].blocked) callback(x, y+1);

  },

  eachNeighbourNode: function(node, callback) {

    var x   = node.x,
        y   = node.y,
        w   = this.width,
        h   = this.height,
        ns  = this.nodes,
        ix  = (y * w) + h;

    if (x > 0   && !ns[ix-1].blocked) callback(ns[ix-1]);
    if (x < w-1 && !ns[ix+1].blocked) callback(ns[ix+1]);
    if (y > 0   && !ns[ix-w].blocked) callback(ns[ix-w]);
    if (y < h-1 && !ns[ix+w].blocked) callback(ns[ix+w]);
  
  },

  eachNode: function(callback) {
    this.nodes.forEach(callback);
  }

};

module.exports.GridWorld = GridWorld;
},{}],7:[function(require,module,exports){
function I(v) { return v; }

function MinHeap(scoreFn) {
  this.score = scoreFn || I;
  this.heap = [];
  this.size = 0;
}

MinHeap.prototype = {
  
  insert: function(item) {
    
    var score = this.score(item),
        heap  = this.heap,
        ix    = this.size++;
        
    heap[ix] = item;
    
    var parent = (ix-1)>>1;
    
    while ((ix > 0) && (this.score(heap[parent]) > score)) {
      var tmp = heap[parent];
      heap[parent] = heap[ix];
      heap[ix] = tmp;
      ix = parent;
      parent = (ix-1)>>1;
    }
        
  },
  
  remove: function() {
    
    var heap  = this.heap,
        score = this.score;
    
    if (this.size === 0)
      return undefined;
      
    var out = heap[0];
    
    heap[0] = heap[--this.size];
    heap[this.size] = null;
    
    var ix = 0;
    
    while (true) {
      
      var leftIx  = (ix<<1)+1,
          rightIx = (ix<<1)+2,
          minIx   = ix;
      
      if (leftIx < this.size && score(heap[leftIx]) < score(heap[minIx])) {
        minIx = leftIx;
      }
      
      if (rightIx < this.size && score(heap[rightIx]) < score(heap[minIx])) {
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
    
    return out;
    
  }

};

exports.MinHeap = MinHeap;
},{}]},{},[1])
;