var trip = {
  astar: require('./lib/astar'),

  create: function(algorithm, map, options) {
    return trip[algorithm].create(map, options);
  }
}

module.exports = trip;