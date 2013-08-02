var alg = {
  astar : require('./lib/astar')
};

module.exports = {
	alg: alg,

  create: function(algorithm, map, options) {
    return alg[algorithm].create(map, options);
  }
};
