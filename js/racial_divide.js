(function() {
  var CityView, difference_between, edge, hashChange, root, tract_ratio,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  root = typeof exports !== "undefined" && exports !== null ? exports : this;

  root.showCity = function(cityId) {
    var cities, data;
    cities = {
      "cr": {
        id: "cr",
        name: "charleston",
        x: -7400,
        y: -1700,
        scale: 30000,
        tract_id: 'GEOID'
      },
      "ba": {
        id: "ba",
        name: "baltimore",
        x: -15750,
        y: 3400,
        scale: 57000
      },
      "mw": {
        id: "mw",
        name: "milwaukee",
        display: "Milwaukee, WI",
        x: -3300,
        y: 3150,
        scale: 30000
      },
      "ch": {
        id: "ch",
        name: "chicago",
        x: -2600,
        y: 2050,
        scale: 23000
      },
      "dy": {
        id: "dy",
        name: "dayton",
        x: -3600,
        y: 1250,
        scale: 22000
      },
      "co": {
        id: "co",
        name: "columbus",
        x: -4500,
        y: 1600,
        scale: 25000
      },
      "pt": {
        id: "pt",
        name: "pittsburgh",
        x: -4800,
        y: 1700,
        scale: 22000
      },
      "kc": {
        id: "kc",
        name: "kc",
        x: -350,
        y: 600,
        scale: 16000
      },
      "sy": {
        id: "sy",
        name: "syracuse",
        x: -5100,
        y: 2700,
        scale: 20000
      },
      "sl": {
        id: "sl",
        name: "st_louis",
        x: -1650,
        y: 600,
        scale: 20000
      },
      "dn": {
        id: "dn",
        name: "denver",
        x: 2300,
        y: 1000,
        scale: 20000
      },
      "oc": {
        id: "oc",
        name: "ok_city",
        x: 280,
        y: -600,
        scale: 20000
      },
      "wc": {
        id: "wc",
        name: "wichita",
        x: 200,
        y: 200,
        scale: 20000
      },
      "mp": {
        id: "mp",
        name: "memphis",
        x: -2800,
        y: -900,
        scale: 28000
      }
    };
    data = cities[cityId];
    if (window.city_view) {
      window.city_view.remove_vis();
      window.city_view = null;
    }
    window.city_view = new CityView(data.name, data.x, data.y, data.scale, data);
    return window.city_view.display_city();
  };

  tract_ratio = function(tract) {
    if (+tract.P003001 > 20) {
      return +tract.P003003 / +tract.P003001;
    } else {
      return 0;
    }
  };

  difference_between = function(tract_a, tract_b) {
    var ratio_a, ratio_b;
    ratio_a = tract_ratio(tract_a);
    ratio_b = tract_ratio(tract_b);
    return Math.abs(ratio_b - ratio_a);
  };

  edge = function(a, b) {
    var diff, distance, dx, dy, e;
    dx = a.x - b.x;
    dy = a.y - b.y;
    diff = difference_between(a.tract_data, b.tract_data) * 100;
    distance = Math.sqrt(dx * dx + dy * dy) + diff;
    e = {
      source: a,
      target: b,
      distance: distance
    };
    return e;
  };

  CityView = (function() {
    CityView.prototype.resize = function() {
      var p, targetWidth;
      p = this.vis.node().parentNode;
      targetWidth = +d3.select(p).style("width").replace("px", "");
      console.log('resize ' + targetWidth);
      this.vis.attr("width", targetWidth);
      return this.vis.attr("height", targetWidth / this.aspect);
    };

    function CityView(name, x, y, scale, data1) {
      this.name = name;
      this.x = x;
      this.y = y;
      this.scale = scale;
      this.data = data1;
      this.display_city = bind(this.display_city, this);
      this.opacity_for = bind(this.opacity_for, this);
      this.color_for = bind(this.color_for, this);
      this.remove_vis = bind(this.remove_vis, this);
      this.setup_data = bind(this.setup_data, this);
      this.width = 800;
      this.height = 650;
      this.aspect = this.width / this.height;
      this.csv_data = {};
      this.color = null;
      this.vis = d3.select("#vis").append("svg:svg").attr("id", "vis-svg").attr("width", this.width).attr("height", this.height).attr("viewBox", "0 0 " + this.width + " " + this.height).attr("preserveAspectRatio", "xMidYMid");
      this.vis.append("svg:rect").attr("width", this.width).attr("height", this.height);
      this.resize();
    }

    CityView.prototype.setup_data = function(csv) {
      var j, len, max_pop, min_pop, tract;
      for (j = 0, len = csv.length; j < len; j++) {
        tract = csv[j];
        this.csv_data[tract.GEOID] = tract;
      }
      max_pop = d3.max(csv, function(d) {
        return tract_ratio(d);
      });
      min_pop = d3.min(csv, function(d) {
        return tract_ratio(d);
      });
      return this.color = d3.scale.linear().range(["#F5F5F5", "#303030"]).domain([min_pop, max_pop]);
    };

    CityView.prototype.remove_vis = function() {
      this.force.stop();
      return d3.select("#vis-svg").remove();
    };

    CityView.prototype.color_for = function(data) {
      return this.color(tract_ratio(data));
    };

    CityView.prototype.opacity_for = function(data) {
      if (+data.P003001 > 20) {
        return 1.0;
      } else {
        return 0.0;
      }
    };

    CityView.prototype.display_city = function() {
      var path, xy;
      xy = d3.geo.albersUsa().translate([this.x, this.y]).scale(this.scale);
      path = d3.geo.path().projection(xy);
      this.force = d3.layout.force().size([this.width, this.height]);
      return d3.csv("data/cities/" + this.name + "_race.csv", (function(_this) {
        return function(csv) {
          var tract_id;
          _this.setup_data(csv);
          tract_id = _this.data.tract_id;
          if (!tract_id) {
            tract_id = 'GEOID10';
          }
          return d3.json("data/cities/" + _this.name + "_tracts.json", function(tracts) {
            var links, node, nodes, tick_count;
            nodes = [];
            links = [];
            tracts.features.forEach(function(d, i) {
              var centroid;
              centroid = path.centroid(d);
              centroid.x = centroid[0];
              centroid.y = centroid[1];
              centroid.feature = d;
              centroid.tract_data = _this.csv_data[d.properties[tract_id]];
              if (centroid.tract_data) {
                return nodes.push(centroid);
              } else {
                return console.log("skipping tract " + d.properties[tract_id]);
              }
            });
            d3.geom.delaunay(nodes).forEach(function(d) {
              links.push(edge(d[0], d[1]));
              links.push(edge(d[1], d[2]));
              return links.push(edge(d[2], d[0]));
            });
            _this.force.gravity(0.0).nodes(nodes).links(links).linkDistance(function(d) {
              return d.distance;
            }).charge(-0.6).friction(0.4).theta(0.9);
            node = _this.vis.selectAll("g").data(nodes).enter().append("svg:g").attr("transform", function(d) {
              return "translate(" + (-d.x) + "," + (-d.y) + ")";
            }).append("svg:path").attr("transform", function(d) {
              return "translate(" + (-d.x) + "," + (-d.y) + ")";
            }).attr("d", function(d) {
              return path(d.feature);
            }).attr("fill-opacity", 0.0).attr("fill", function(d) {
              return _this.color_for(d.tract_data);
            }).attr("stroke", "#222").attr("stroke-width", 0).attr("stroke-opacity", 0.0).on("click", function(d) {
              return console.log(d);
            });
            node.attr("transform", function(d) {
              return "translate(" + d.x + "," + d.y + ")";
            });
            node.transition().duration(1000).attr("fill-opacity", function(d) {
              return _this.opacity_for(d.tract_data);
            });
            d3.transition().delay(1500).each("end", function() {
              return _this.force.start();
            });
            tick_count = 0;
            return _this.force.on("tick", function(e) {
              node.attr("transform", function(d) {
                return "translate(" + d.x + "," + d.y + ")";
              });
              tick_count += 1;
              if (tick_count > 150) {
                return _this.force.stop();
              }
            });
          });
        };
      })(this));
    };

    return CityView;

  })();

  hashChange = function() {
    var cityId;
    cityId = decodeURIComponent(location.hash.substring(1)).trim();
    if (cityId.length === 0) {
      cityId = 'mw';
    }
    d3.selectAll('#cities a').classed("active", false);
    d3.select('#' + cityId).classed("active", true);
    return root.showCity(cityId);
  };

  d3.select(window).on('hashchange', hashChange);

  d3.selectAll('#cities a').on('click', function(e) {
    var cityId;
    cityId = d3.select(this).attr("id");
    location.replace('#' + encodeURIComponent(cityId));
    return d3.event.preventDefault();
  });

  d3.select(window).on('hashchange', hashChange);

  d3.select("#play").on('click', hashChange);

  hashChange();

}).call(this);
