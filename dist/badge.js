(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function(){
  window.octobadge = {
    util: require('./src/util')
  }

  var el = octobadge.util.el;

  /*
   * Set basic info from the widget
   */
  function widgetInit(widget, data){
    widget.className = 'github-badge';
    data.orientation = widget.getAttribute('orientation') || 'vertical';
    if(data.orientation) widget.className += ' '+data.orientation;
    data.badge = widget.getAttribute('badge') || 'octo';
    widget.className += ' '+data.badge;
    data.username = widget.getAttribute('user');
  }

  /*
   * Main Widget Class
   */
  var Widget = function(widget){
    var nodes = {};

    var data = {
      stargazers: 0,
      repos: [],
      repos_count: 0,
      languages: {}
    };

    //Create elements
    widgetInit(widget, data);
    var elements = require('./src/elements')(widget, data, nodes);
    elements.summary();
    elements.detail();
    require('./src/octodex.js')(widget, el('img'));
    elements.history();

    //Load data
    require('./src/data.js')(widget, data, nodes);
  }

  /*
   * Badge is Initialized Here
   */
  var init = (function(){
    var widgets = document.getElementsByTagName('github-badge');
    if(widgets.length){
      //Add external dependencies
      function addCSS(src){
        var head = document.getElementsByTagName('head')[0];         
        var css = el('link');
        css.type = 'text/css';
        css.rel = 'stylesheet';
        css.href = src;
        head.appendChild(css);
      }
      addCSS('//cdnjs.cloudflare.com/ajax/libs/octicons/2.2.2/octicons.min.css');
      addCSS('//maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css');

      for(var i=0;i<widgets.length;i++){
        new Widget(widgets[i]);
      }
    }
  })();
})();

},{"./src/data.js":2,"./src/elements":3,"./src/octodex.js":4,"./src/util":5}],2:[function(require,module,exports){
var el = octobadge.util.el;

/*
 * Set widget's basic data
 */
function widgetDataBasic(widget, widget_data, data, nodes){

    widget.addEventListener('click', function(){
      var a = el('a');
      a.target = "_blank";
      a.href = 'https://github.com/'+data.username;
      a.click();
    });

    if(nodes.img) nodes.img.src = ['https://avatars.githubusercontent.com', 'u', data.id].join('/');

    if(nodes.name) nodes.name.innerHTML = data.name;

    if(nodes.location) nodes.location.innerHTML = data.location;

    if(nodes.followers) nodes.followers.innerHTML = data.followers + (widget_data.badge != 'octo' ? ' followers' : '');

    if(nodes.repostotal){
      nodes.repostotal.innerHTML = data.public_repos + (widget_data.badge != 'octo' ? ' public repos' : '');
      widget_data.repos_count = data.public_repos;
    }

    if(nodes.gists) nodes.gists.innerHTML = data.public_gists + ' gists';
  
    var page = 0;
}

/*
 * Set star data
 */
function widgetDataStars(widget, widget_data, data, nodes){
  if(nodes.stars) nodes.stars.innerHTML = data.total + (widget_data.badge != 'octo' ? ' stars' : '');   
}

/*
 * Populate contribution graph
 */
function widgetDataHistory(widget, widget_data, data, nodes){
  if(widget_data.badge != 'octo') return;

  for(key in widget_data.history.days){
    var day = widget_data.history.days[key];
    var dataForDay = data[key];

    if(dataForDay) day.value = dataForDay;

    var dayClass = '';

    if(day.value >= 18){
      dayClass = 'many-commits';
    } else if(day.value >= 12){
      dayClass = 'more-commits';
    } else if(day.value >= 6){
      dayClass = 'some-commits';
    } else if(day.value > 0){
      dayClass = 'few-commits';
    }

    day.el.className = dayClass;
  }
}

/*
 * Load the Widget's Repo Data
 */ 
function widgetDataRepos(widget, widget_data, data, nodes){
  console.log('data is', data);

  if(widget_data.badge != 'octo'){
    var sorted = data.repos.sort(function(a, b){
      if(a.stargazers_count < b.stargazers_count) return 1;
      if(a.stargazers_count > b.stargazers_count) return -1;
      return 0;
    });

    var t = sorted.slice(0, 3);
    t.map(function(repo){
      var p = el('p');
      var i = el('i');
      i.className = 'fa fa-star';
      p.appendChild(i);
      var s = el('span');
      s.innerHTML = repo.stargazers_count;
      p.appendChild(s);
      p.innerHTML = p.innerHTML + repo.name + ' ('+repo.language+')';
      nodes.repos.listContainer.appendChild(p);
    });

    
    var langP = el('p');
    var langArray = [];
    for(var key in data.languages){
      if(key != 'null'){
        var obj = {name: key, value: data.languages[key]};
        langArray.push(obj);
      }
    }

    var langSorted = langArray.sort(function(a, b){        
      if(a.value < b.value) return 1;
      if(a.value > b.value) return -1;
      return 0;
    });

    var langString = langSorted.map(function(lang){
      return lang.name;
    }).join(', ');


    langP.innerHTML = langString;

    nodes.languages.listContainer.appendChild(langP);
  }
}

/*
 * Load Widget data from the API
 */
function widgetData(widget, widget_data, nodes){
  var API_ENDPOINT = 'http://deviant.io';
  if(widget.getAttribute('dev')) API_ENDPOINT = 'http://127.0.0.1:3000';
  var API_URL = API_ENDPOINT + '/data/github/{user}/user.json';
  API_URL = API_URL.replace('{user}', widget_data.username);

  var fn = 'gh_badge_data_'+widget_data.username;

  window[fn] = function(res){
    if(res.profile && res.repos && res.languages && res.stars){
      widgetDataBasic(widget, widget_data, res.profile, nodes);
      widgetDataStars(widget, widget_data, res.stars, nodes);
      widgetDataHistory(widget, widget_data, res.contributions, nodes);
      widgetDataRepos(widget, widget_data, {repos: res.repos.items, languages: res.languages}, nodes);
    }
  }

  octobadge.util.loadJSONP( API_URL, fn );
}

module.exports = widgetData;

},{}],3:[function(require,module,exports){
var el = octobadge.util.el;

module.exports = function(widget, data, nodes){
  /*
   * Build the widget summary column
   */
  function widgetSummaryColumnElements(){
    //Create summary column
    nodes.summary = el('div');
    nodes.summary.className = 'gb-summary';

    var img = el('img');
    img.className = "user";
    img.width = (data.badge == 'octo' ? "50" : "100");
    nodes.img = img;
    nodes.summary.appendChild(nodes.img);

    var name = el('h4');
    nodes.name = name;
    nodes.summary.appendChild(nodes.name);

    function pwContent(contentName, iconClass){
      var containerName = contentName + 'Container';
      var c = el('p');
      c.className = contentName;
      var i = el('i');
      i.className=iconClass;
      c.appendChild(i);
      nodes[contentName] = el('span');
      c.appendChild(nodes[contentName]);
      nodes[containerName] = c;
      nodes.summary.appendChild(nodes[containerName]);
    }

    if(data.badge != 'octo') pwContent('location', 'fa fa-map-marker');
    pwContent('followers', 'fa fa-users');
    pwContent('repostotal', 'octicon octicon-repo');
    pwContent('stars', 'fa fa-star');
    if(data.badge != 'octo') pwContent('gists', 'fa fa-pencil');

    widget.appendChild(nodes.summary);
  }

  /*
   * Create detail elements
   */
  function widgetDetailElements(){
    if(data.badge != 'octo'){
      //Repos
      nodes.detail = el('div');
      nodes.detail.className = "detail";

      nodes.repos = {
        container: el('section'),
        title: el('h4'),
        listContainer: el('div')
      }

      nodes.repos.container.className = 'repos';
      nodes.repos.title.innerHTML = 'Popular repositories';

      var r_ = nodes.repos;
      var rc = r_.container;
      rc.appendChild(r_.title);
      rc.appendChild(r_.listContainer);
      nodes.detail.appendChild(rc);

      //Languages
      nodes.languages = {
        container: el('section'),
        title: el('h4'),
        listContainer: el('div')
      }

      nodes.languages.container.className = 'languages';
      nodes.languages.title.innerHTML = 'Codes in';
      nodes.languages.container.appendChild(nodes.languages.title);
      nodes.languages.container.appendChild(nodes.languages.listContainer);

      nodes.detail.appendChild(nodes.languages.container);

      widget.appendChild(nodes.detail);
    }
  }

  /*
   * Add the history elements
   */
  function widgetHistoryElement(){  
    if(data.badge == 'octo'){
      nodes.history = el('div');
      nodes.history.className = 'history';
      nodes.history.id = 'github-badge-history';

      var day = new Date();
      day.setHours(0,0,0,0);
      day.setDate(day.getDate()-29);
      var DAYS_OF_HISTORY = 30;

      function padDigits(number, digits) {
        return Array(Math.max(digits - String(number).length + 1, 0)).join(0) + number;
      }

      data.history = {days: {}};
      for(var i=0;i<DAYS_OF_HISTORY;i++){
        var date = [day.getFullYear(), padDigits((day.getMonth()+1), 2), padDigits(day.getDate(), 2)].join('-')
        var dayEl = el('i');
        data.history.days[date] = {
          el: dayEl,
          value: 0
        };
        dayEl.setAttribute('data-date', date);
        day.setDate(day.getDate()+1);
        nodes.history.appendChild(dayEl);
      }

      widget.appendChild(nodes.history);
    }
  }

  return {
    summary: widgetSummaryColumnElements,
    detail: widgetDetailElements,
    history: widgetHistoryElement
  }
}

},{}],4:[function(require,module,exports){
/*
 * Add octodex to the widget
 */
function widgetOctodex(widget, octodex){
  octodex.className = 'octodex';
  octodex.width = '30';
  octodex.src = 'data:image/png;base64,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';
  widget.appendChild(octodex);
}

module.exports = widgetOctodex;

},{}],5:[function(require,module,exports){
/**
 * Load and cache JSONP data
 */
var loadJSONP = function ( url, callback ) {
  var setLocalData = false;

  //localStorage.removeItem(url);
  
  /*
   * Setting a variable callback method since we're writing to window
   */
  var callbackMethod = url.replace(/[^a-zA-Z0-9]/g, '_')
  /*
   * Send data to the callback function, caching data if needed
   */
  window[callbackMethod] = function(data){
    if(setLocalData){
      //Cache for 1 day
      var d = new Date();
      d.setDate(d.getDate()+1);

      try {
        localStorage.setItem(url, JSON.stringify({expiry: d.getTime(), value: data}));
      } catch(e){
        console.log("Could not add item to local storage...clearing localStorage...", e);
        localStorage.clear();
      }
    }

    window[callback](data);
  }

  /*
   * Make the JSONP request
   */
  function requestDataFromRemote(){
    // Create script with url and callback (if specified)
    var ref = window.document.getElementsByTagName( 'script' )[ 0 ];
    var script = window.document.createElement( 'script' );
    script.src = url + (url.indexOf( '?' ) + 1 ? '&' : '?') + 'callback='+callbackMethod;

    // Insert script tag into the DOM (append to <head>)
    ref.parentNode.insertBefore( script, ref );

    // After the script is loaded (and executed), remove it
    script.onload = function () {
        this.remove();
    };
  }

  var stored = localStorage.getItem(url);
  if(stored){
    var now = (new Date()).getTime();
    var json = JSON.parse(stored);

    if(json.expiry > now){
      window[callbackMethod](json.value);
    } else {
      localStorage.removeItem(url);
      setLocalData = true;
      requestDataFromRemote();
    }
  } else {
    setLocalData = true;
    requestDataFromRemote();
  }
};


/*
 * Shorthand to grab an element
 */
var el = function(s){
  return document.createElement(s);
}

module.exports = {
  loadJSONP: loadJSONP,
  el: el
}

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJiYWRnZS5qcyIsInNyYy9kYXRhLmpzIiwic3JjL2VsZW1lbnRzLmpzIiwic3JjL29jdG9kZXguanMiLCJzcmMvdXRpbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIihmdW5jdGlvbigpe1xuICB3aW5kb3cub2N0b2JhZGdlID0ge1xuICAgIHV0aWw6IHJlcXVpcmUoJy4vc3JjL3V0aWwnKVxuICB9XG5cbiAgdmFyIGVsID0gb2N0b2JhZGdlLnV0aWwuZWw7XG5cbiAgLypcbiAgICogU2V0IGJhc2ljIGluZm8gZnJvbSB0aGUgd2lkZ2V0XG4gICAqL1xuICBmdW5jdGlvbiB3aWRnZXRJbml0KHdpZGdldCwgZGF0YSl7XG4gICAgd2lkZ2V0LmNsYXNzTmFtZSA9ICdnaXRodWItYmFkZ2UnO1xuICAgIGRhdGEub3JpZW50YXRpb24gPSB3aWRnZXQuZ2V0QXR0cmlidXRlKCdvcmllbnRhdGlvbicpIHx8ICd2ZXJ0aWNhbCc7XG4gICAgaWYoZGF0YS5vcmllbnRhdGlvbikgd2lkZ2V0LmNsYXNzTmFtZSArPSAnICcrZGF0YS5vcmllbnRhdGlvbjtcbiAgICBkYXRhLmJhZGdlID0gd2lkZ2V0LmdldEF0dHJpYnV0ZSgnYmFkZ2UnKSB8fCAnb2N0byc7XG4gICAgd2lkZ2V0LmNsYXNzTmFtZSArPSAnICcrZGF0YS5iYWRnZTtcbiAgICBkYXRhLnVzZXJuYW1lID0gd2lkZ2V0LmdldEF0dHJpYnV0ZSgndXNlcicpO1xuICB9XG5cbiAgLypcbiAgICogTWFpbiBXaWRnZXQgQ2xhc3NcbiAgICovXG4gIHZhciBXaWRnZXQgPSBmdW5jdGlvbih3aWRnZXQpe1xuICAgIHZhciBub2RlcyA9IHt9O1xuXG4gICAgdmFyIGRhdGEgPSB7XG4gICAgICBzdGFyZ2F6ZXJzOiAwLFxuICAgICAgcmVwb3M6IFtdLFxuICAgICAgcmVwb3NfY291bnQ6IDAsXG4gICAgICBsYW5ndWFnZXM6IHt9XG4gICAgfTtcblxuICAgIC8vQ3JlYXRlIGVsZW1lbnRzXG4gICAgd2lkZ2V0SW5pdCh3aWRnZXQsIGRhdGEpO1xuICAgIHZhciBlbGVtZW50cyA9IHJlcXVpcmUoJy4vc3JjL2VsZW1lbnRzJykod2lkZ2V0LCBkYXRhLCBub2Rlcyk7XG4gICAgZWxlbWVudHMuc3VtbWFyeSgpO1xuICAgIGVsZW1lbnRzLmRldGFpbCgpO1xuICAgIHJlcXVpcmUoJy4vc3JjL29jdG9kZXguanMnKSh3aWRnZXQsIGVsKCdpbWcnKSk7XG4gICAgZWxlbWVudHMuaGlzdG9yeSgpO1xuXG4gICAgLy9Mb2FkIGRhdGFcbiAgICByZXF1aXJlKCcuL3NyYy9kYXRhLmpzJykod2lkZ2V0LCBkYXRhLCBub2Rlcyk7XG4gIH1cblxuICAvKlxuICAgKiBCYWRnZSBpcyBJbml0aWFsaXplZCBIZXJlXG4gICAqL1xuICB2YXIgaW5pdCA9IChmdW5jdGlvbigpe1xuICAgIHZhciB3aWRnZXRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2dpdGh1Yi1iYWRnZScpO1xuICAgIGlmKHdpZGdldHMubGVuZ3RoKXtcbiAgICAgIC8vQWRkIGV4dGVybmFsIGRlcGVuZGVuY2llc1xuICAgICAgZnVuY3Rpb24gYWRkQ1NTKHNyYyl7XG4gICAgICAgIHZhciBoZWFkID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXTsgICAgICAgICBcbiAgICAgICAgdmFyIGNzcyA9IGVsKCdsaW5rJyk7XG4gICAgICAgIGNzcy50eXBlID0gJ3RleHQvY3NzJztcbiAgICAgICAgY3NzLnJlbCA9ICdzdHlsZXNoZWV0JztcbiAgICAgICAgY3NzLmhyZWYgPSBzcmM7XG4gICAgICAgIGhlYWQuYXBwZW5kQ2hpbGQoY3NzKTtcbiAgICAgIH1cbiAgICAgIGFkZENTUygnLy9jZG5qcy5jbG91ZGZsYXJlLmNvbS9hamF4L2xpYnMvb2N0aWNvbnMvMi4yLjIvb2N0aWNvbnMubWluLmNzcycpO1xuICAgICAgYWRkQ1NTKCcvL21heGNkbi5ib290c3RyYXBjZG4uY29tL2ZvbnQtYXdlc29tZS80LjMuMC9jc3MvZm9udC1hd2Vzb21lLm1pbi5jc3MnKTtcblxuICAgICAgZm9yKHZhciBpPTA7aTx3aWRnZXRzLmxlbmd0aDtpKyspe1xuICAgICAgICBuZXcgV2lkZ2V0KHdpZGdldHNbaV0pO1xuICAgICAgfVxuICAgIH1cbiAgfSkoKTtcbn0pKCk7XG4iLCJ2YXIgZWwgPSBvY3RvYmFkZ2UudXRpbC5lbDtcblxuLypcbiAqIFNldCB3aWRnZXQncyBiYXNpYyBkYXRhXG4gKi9cbmZ1bmN0aW9uIHdpZGdldERhdGFCYXNpYyh3aWRnZXQsIHdpZGdldF9kYXRhLCBkYXRhLCBub2Rlcyl7XG5cbiAgICB3aWRnZXQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpe1xuICAgICAgdmFyIGEgPSBlbCgnYScpO1xuICAgICAgYS50YXJnZXQgPSBcIl9ibGFua1wiO1xuICAgICAgYS5ocmVmID0gJ2h0dHBzOi8vZ2l0aHViLmNvbS8nK2RhdGEudXNlcm5hbWU7XG4gICAgICBhLmNsaWNrKCk7XG4gICAgfSk7XG5cbiAgICBpZihub2Rlcy5pbWcpIG5vZGVzLmltZy5zcmMgPSBbJ2h0dHBzOi8vYXZhdGFycy5naXRodWJ1c2VyY29udGVudC5jb20nLCAndScsIGRhdGEuaWRdLmpvaW4oJy8nKTtcblxuICAgIGlmKG5vZGVzLm5hbWUpIG5vZGVzLm5hbWUuaW5uZXJIVE1MID0gZGF0YS5uYW1lO1xuXG4gICAgaWYobm9kZXMubG9jYXRpb24pIG5vZGVzLmxvY2F0aW9uLmlubmVySFRNTCA9IGRhdGEubG9jYXRpb247XG5cbiAgICBpZihub2Rlcy5mb2xsb3dlcnMpIG5vZGVzLmZvbGxvd2Vycy5pbm5lckhUTUwgPSBkYXRhLmZvbGxvd2VycyArICh3aWRnZXRfZGF0YS5iYWRnZSAhPSAnb2N0bycgPyAnIGZvbGxvd2VycycgOiAnJyk7XG5cbiAgICBpZihub2Rlcy5yZXBvc3RvdGFsKXtcbiAgICAgIG5vZGVzLnJlcG9zdG90YWwuaW5uZXJIVE1MID0gZGF0YS5wdWJsaWNfcmVwb3MgKyAod2lkZ2V0X2RhdGEuYmFkZ2UgIT0gJ29jdG8nID8gJyBwdWJsaWMgcmVwb3MnIDogJycpO1xuICAgICAgd2lkZ2V0X2RhdGEucmVwb3NfY291bnQgPSBkYXRhLnB1YmxpY19yZXBvcztcbiAgICB9XG5cbiAgICBpZihub2Rlcy5naXN0cykgbm9kZXMuZ2lzdHMuaW5uZXJIVE1MID0gZGF0YS5wdWJsaWNfZ2lzdHMgKyAnIGdpc3RzJztcbiAgXG4gICAgdmFyIHBhZ2UgPSAwO1xufVxuXG4vKlxuICogU2V0IHN0YXIgZGF0YVxuICovXG5mdW5jdGlvbiB3aWRnZXREYXRhU3RhcnMod2lkZ2V0LCB3aWRnZXRfZGF0YSwgZGF0YSwgbm9kZXMpe1xuICBpZihub2Rlcy5zdGFycykgbm9kZXMuc3RhcnMuaW5uZXJIVE1MID0gZGF0YS50b3RhbCArICh3aWRnZXRfZGF0YS5iYWRnZSAhPSAnb2N0bycgPyAnIHN0YXJzJyA6ICcnKTsgICBcbn1cblxuLypcbiAqIFBvcHVsYXRlIGNvbnRyaWJ1dGlvbiBncmFwaFxuICovXG5mdW5jdGlvbiB3aWRnZXREYXRhSGlzdG9yeSh3aWRnZXQsIHdpZGdldF9kYXRhLCBkYXRhLCBub2Rlcyl7XG4gIGlmKHdpZGdldF9kYXRhLmJhZGdlICE9ICdvY3RvJykgcmV0dXJuO1xuXG4gIGZvcihrZXkgaW4gd2lkZ2V0X2RhdGEuaGlzdG9yeS5kYXlzKXtcbiAgICB2YXIgZGF5ID0gd2lkZ2V0X2RhdGEuaGlzdG9yeS5kYXlzW2tleV07XG4gICAgdmFyIGRhdGFGb3JEYXkgPSBkYXRhW2tleV07XG5cbiAgICBpZihkYXRhRm9yRGF5KSBkYXkudmFsdWUgPSBkYXRhRm9yRGF5O1xuXG4gICAgdmFyIGRheUNsYXNzID0gJyc7XG5cbiAgICBpZihkYXkudmFsdWUgPj0gMTgpe1xuICAgICAgZGF5Q2xhc3MgPSAnbWFueS1jb21taXRzJztcbiAgICB9IGVsc2UgaWYoZGF5LnZhbHVlID49IDEyKXtcbiAgICAgIGRheUNsYXNzID0gJ21vcmUtY29tbWl0cyc7XG4gICAgfSBlbHNlIGlmKGRheS52YWx1ZSA+PSA2KXtcbiAgICAgIGRheUNsYXNzID0gJ3NvbWUtY29tbWl0cyc7XG4gICAgfSBlbHNlIGlmKGRheS52YWx1ZSA+IDApe1xuICAgICAgZGF5Q2xhc3MgPSAnZmV3LWNvbW1pdHMnO1xuICAgIH1cblxuICAgIGRheS5lbC5jbGFzc05hbWUgPSBkYXlDbGFzcztcbiAgfVxufVxuXG4vKlxuICogTG9hZCB0aGUgV2lkZ2V0J3MgUmVwbyBEYXRhXG4gKi8gXG5mdW5jdGlvbiB3aWRnZXREYXRhUmVwb3Mod2lkZ2V0LCB3aWRnZXRfZGF0YSwgZGF0YSwgbm9kZXMpe1xuICBjb25zb2xlLmxvZygnZGF0YSBpcycsIGRhdGEpO1xuXG4gIGlmKHdpZGdldF9kYXRhLmJhZGdlICE9ICdvY3RvJyl7XG4gICAgdmFyIHNvcnRlZCA9IGRhdGEucmVwb3Muc29ydChmdW5jdGlvbihhLCBiKXtcbiAgICAgIGlmKGEuc3RhcmdhemVyc19jb3VudCA8IGIuc3RhcmdhemVyc19jb3VudCkgcmV0dXJuIDE7XG4gICAgICBpZihhLnN0YXJnYXplcnNfY291bnQgPiBiLnN0YXJnYXplcnNfY291bnQpIHJldHVybiAtMTtcbiAgICAgIHJldHVybiAwO1xuICAgIH0pO1xuXG4gICAgdmFyIHQgPSBzb3J0ZWQuc2xpY2UoMCwgMyk7XG4gICAgdC5tYXAoZnVuY3Rpb24ocmVwbyl7XG4gICAgICB2YXIgcCA9IGVsKCdwJyk7XG4gICAgICB2YXIgaSA9IGVsKCdpJyk7XG4gICAgICBpLmNsYXNzTmFtZSA9ICdmYSBmYS1zdGFyJztcbiAgICAgIHAuYXBwZW5kQ2hpbGQoaSk7XG4gICAgICB2YXIgcyA9IGVsKCdzcGFuJyk7XG4gICAgICBzLmlubmVySFRNTCA9IHJlcG8uc3RhcmdhemVyc19jb3VudDtcbiAgICAgIHAuYXBwZW5kQ2hpbGQocyk7XG4gICAgICBwLmlubmVySFRNTCA9IHAuaW5uZXJIVE1MICsgcmVwby5uYW1lICsgJyAoJytyZXBvLmxhbmd1YWdlKycpJztcbiAgICAgIG5vZGVzLnJlcG9zLmxpc3RDb250YWluZXIuYXBwZW5kQ2hpbGQocCk7XG4gICAgfSk7XG5cbiAgICBcbiAgICB2YXIgbGFuZ1AgPSBlbCgncCcpO1xuICAgIHZhciBsYW5nQXJyYXkgPSBbXTtcbiAgICBmb3IodmFyIGtleSBpbiBkYXRhLmxhbmd1YWdlcyl7XG4gICAgICBpZihrZXkgIT0gJ251bGwnKXtcbiAgICAgICAgdmFyIG9iaiA9IHtuYW1lOiBrZXksIHZhbHVlOiBkYXRhLmxhbmd1YWdlc1trZXldfTtcbiAgICAgICAgbGFuZ0FycmF5LnB1c2gob2JqKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgbGFuZ1NvcnRlZCA9IGxhbmdBcnJheS5zb3J0KGZ1bmN0aW9uKGEsIGIpeyAgICAgICAgXG4gICAgICBpZihhLnZhbHVlIDwgYi52YWx1ZSkgcmV0dXJuIDE7XG4gICAgICBpZihhLnZhbHVlID4gYi52YWx1ZSkgcmV0dXJuIC0xO1xuICAgICAgcmV0dXJuIDA7XG4gICAgfSk7XG5cbiAgICB2YXIgbGFuZ1N0cmluZyA9IGxhbmdTb3J0ZWQubWFwKGZ1bmN0aW9uKGxhbmcpe1xuICAgICAgcmV0dXJuIGxhbmcubmFtZTtcbiAgICB9KS5qb2luKCcsICcpO1xuXG5cbiAgICBsYW5nUC5pbm5lckhUTUwgPSBsYW5nU3RyaW5nO1xuXG4gICAgbm9kZXMubGFuZ3VhZ2VzLmxpc3RDb250YWluZXIuYXBwZW5kQ2hpbGQobGFuZ1ApO1xuICB9XG59XG5cbi8qXG4gKiBMb2FkIFdpZGdldCBkYXRhIGZyb20gdGhlIEFQSVxuICovXG5mdW5jdGlvbiB3aWRnZXREYXRhKHdpZGdldCwgd2lkZ2V0X2RhdGEsIG5vZGVzKXtcbiAgdmFyIEFQSV9FTkRQT0lOVCA9ICdodHRwOi8vZGV2aWFudC5pbyc7XG4gIGlmKHdpZGdldC5nZXRBdHRyaWJ1dGUoJ2RldicpKSBBUElfRU5EUE9JTlQgPSAnaHR0cDovLzEyNy4wLjAuMTozMDAwJztcbiAgdmFyIEFQSV9VUkwgPSBBUElfRU5EUE9JTlQgKyAnL2RhdGEvZ2l0aHViL3t1c2VyfS91c2VyLmpzb24nO1xuICBBUElfVVJMID0gQVBJX1VSTC5yZXBsYWNlKCd7dXNlcn0nLCB3aWRnZXRfZGF0YS51c2VybmFtZSk7XG5cbiAgdmFyIGZuID0gJ2doX2JhZGdlX2RhdGFfJyt3aWRnZXRfZGF0YS51c2VybmFtZTtcblxuICB3aW5kb3dbZm5dID0gZnVuY3Rpb24ocmVzKXtcbiAgICBpZihyZXMucHJvZmlsZSAmJiByZXMucmVwb3MgJiYgcmVzLmxhbmd1YWdlcyAmJiByZXMuc3RhcnMpe1xuICAgICAgd2lkZ2V0RGF0YUJhc2ljKHdpZGdldCwgd2lkZ2V0X2RhdGEsIHJlcy5wcm9maWxlLCBub2Rlcyk7XG4gICAgICB3aWRnZXREYXRhU3RhcnMod2lkZ2V0LCB3aWRnZXRfZGF0YSwgcmVzLnN0YXJzLCBub2Rlcyk7XG4gICAgICB3aWRnZXREYXRhSGlzdG9yeSh3aWRnZXQsIHdpZGdldF9kYXRhLCByZXMuY29udHJpYnV0aW9ucywgbm9kZXMpO1xuICAgICAgd2lkZ2V0RGF0YVJlcG9zKHdpZGdldCwgd2lkZ2V0X2RhdGEsIHtyZXBvczogcmVzLnJlcG9zLml0ZW1zLCBsYW5ndWFnZXM6IHJlcy5sYW5ndWFnZXN9LCBub2Rlcyk7XG4gICAgfVxuICB9XG5cbiAgb2N0b2JhZGdlLnV0aWwubG9hZEpTT05QKCBBUElfVVJMLCBmbiApO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHdpZGdldERhdGE7XG4iLCJ2YXIgZWwgPSBvY3RvYmFkZ2UudXRpbC5lbDtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih3aWRnZXQsIGRhdGEsIG5vZGVzKXtcbiAgLypcbiAgICogQnVpbGQgdGhlIHdpZGdldCBzdW1tYXJ5IGNvbHVtblxuICAgKi9cbiAgZnVuY3Rpb24gd2lkZ2V0U3VtbWFyeUNvbHVtbkVsZW1lbnRzKCl7XG4gICAgLy9DcmVhdGUgc3VtbWFyeSBjb2x1bW5cbiAgICBub2Rlcy5zdW1tYXJ5ID0gZWwoJ2RpdicpO1xuICAgIG5vZGVzLnN1bW1hcnkuY2xhc3NOYW1lID0gJ2diLXN1bW1hcnknO1xuXG4gICAgdmFyIGltZyA9IGVsKCdpbWcnKTtcbiAgICBpbWcuY2xhc3NOYW1lID0gXCJ1c2VyXCI7XG4gICAgaW1nLndpZHRoID0gKGRhdGEuYmFkZ2UgPT0gJ29jdG8nID8gXCI1MFwiIDogXCIxMDBcIik7XG4gICAgbm9kZXMuaW1nID0gaW1nO1xuICAgIG5vZGVzLnN1bW1hcnkuYXBwZW5kQ2hpbGQobm9kZXMuaW1nKTtcblxuICAgIHZhciBuYW1lID0gZWwoJ2g0Jyk7XG4gICAgbm9kZXMubmFtZSA9IG5hbWU7XG4gICAgbm9kZXMuc3VtbWFyeS5hcHBlbmRDaGlsZChub2Rlcy5uYW1lKTtcblxuICAgIGZ1bmN0aW9uIHB3Q29udGVudChjb250ZW50TmFtZSwgaWNvbkNsYXNzKXtcbiAgICAgIHZhciBjb250YWluZXJOYW1lID0gY29udGVudE5hbWUgKyAnQ29udGFpbmVyJztcbiAgICAgIHZhciBjID0gZWwoJ3AnKTtcbiAgICAgIGMuY2xhc3NOYW1lID0gY29udGVudE5hbWU7XG4gICAgICB2YXIgaSA9IGVsKCdpJyk7XG4gICAgICBpLmNsYXNzTmFtZT1pY29uQ2xhc3M7XG4gICAgICBjLmFwcGVuZENoaWxkKGkpO1xuICAgICAgbm9kZXNbY29udGVudE5hbWVdID0gZWwoJ3NwYW4nKTtcbiAgICAgIGMuYXBwZW5kQ2hpbGQobm9kZXNbY29udGVudE5hbWVdKTtcbiAgICAgIG5vZGVzW2NvbnRhaW5lck5hbWVdID0gYztcbiAgICAgIG5vZGVzLnN1bW1hcnkuYXBwZW5kQ2hpbGQobm9kZXNbY29udGFpbmVyTmFtZV0pO1xuICAgIH1cblxuICAgIGlmKGRhdGEuYmFkZ2UgIT0gJ29jdG8nKSBwd0NvbnRlbnQoJ2xvY2F0aW9uJywgJ2ZhIGZhLW1hcC1tYXJrZXInKTtcbiAgICBwd0NvbnRlbnQoJ2ZvbGxvd2VycycsICdmYSBmYS11c2VycycpO1xuICAgIHB3Q29udGVudCgncmVwb3N0b3RhbCcsICdvY3RpY29uIG9jdGljb24tcmVwbycpO1xuICAgIHB3Q29udGVudCgnc3RhcnMnLCAnZmEgZmEtc3RhcicpO1xuICAgIGlmKGRhdGEuYmFkZ2UgIT0gJ29jdG8nKSBwd0NvbnRlbnQoJ2dpc3RzJywgJ2ZhIGZhLXBlbmNpbCcpO1xuXG4gICAgd2lkZ2V0LmFwcGVuZENoaWxkKG5vZGVzLnN1bW1hcnkpO1xuICB9XG5cbiAgLypcbiAgICogQ3JlYXRlIGRldGFpbCBlbGVtZW50c1xuICAgKi9cbiAgZnVuY3Rpb24gd2lkZ2V0RGV0YWlsRWxlbWVudHMoKXtcbiAgICBpZihkYXRhLmJhZGdlICE9ICdvY3RvJyl7XG4gICAgICAvL1JlcG9zXG4gICAgICBub2Rlcy5kZXRhaWwgPSBlbCgnZGl2Jyk7XG4gICAgICBub2Rlcy5kZXRhaWwuY2xhc3NOYW1lID0gXCJkZXRhaWxcIjtcblxuICAgICAgbm9kZXMucmVwb3MgPSB7XG4gICAgICAgIGNvbnRhaW5lcjogZWwoJ3NlY3Rpb24nKSxcbiAgICAgICAgdGl0bGU6IGVsKCdoNCcpLFxuICAgICAgICBsaXN0Q29udGFpbmVyOiBlbCgnZGl2JylcbiAgICAgIH1cblxuICAgICAgbm9kZXMucmVwb3MuY29udGFpbmVyLmNsYXNzTmFtZSA9ICdyZXBvcyc7XG4gICAgICBub2Rlcy5yZXBvcy50aXRsZS5pbm5lckhUTUwgPSAnUG9wdWxhciByZXBvc2l0b3JpZXMnO1xuXG4gICAgICB2YXIgcl8gPSBub2Rlcy5yZXBvcztcbiAgICAgIHZhciByYyA9IHJfLmNvbnRhaW5lcjtcbiAgICAgIHJjLmFwcGVuZENoaWxkKHJfLnRpdGxlKTtcbiAgICAgIHJjLmFwcGVuZENoaWxkKHJfLmxpc3RDb250YWluZXIpO1xuICAgICAgbm9kZXMuZGV0YWlsLmFwcGVuZENoaWxkKHJjKTtcblxuICAgICAgLy9MYW5ndWFnZXNcbiAgICAgIG5vZGVzLmxhbmd1YWdlcyA9IHtcbiAgICAgICAgY29udGFpbmVyOiBlbCgnc2VjdGlvbicpLFxuICAgICAgICB0aXRsZTogZWwoJ2g0JyksXG4gICAgICAgIGxpc3RDb250YWluZXI6IGVsKCdkaXYnKVxuICAgICAgfVxuXG4gICAgICBub2Rlcy5sYW5ndWFnZXMuY29udGFpbmVyLmNsYXNzTmFtZSA9ICdsYW5ndWFnZXMnO1xuICAgICAgbm9kZXMubGFuZ3VhZ2VzLnRpdGxlLmlubmVySFRNTCA9ICdDb2RlcyBpbic7XG4gICAgICBub2Rlcy5sYW5ndWFnZXMuY29udGFpbmVyLmFwcGVuZENoaWxkKG5vZGVzLmxhbmd1YWdlcy50aXRsZSk7XG4gICAgICBub2Rlcy5sYW5ndWFnZXMuY29udGFpbmVyLmFwcGVuZENoaWxkKG5vZGVzLmxhbmd1YWdlcy5saXN0Q29udGFpbmVyKTtcblxuICAgICAgbm9kZXMuZGV0YWlsLmFwcGVuZENoaWxkKG5vZGVzLmxhbmd1YWdlcy5jb250YWluZXIpO1xuXG4gICAgICB3aWRnZXQuYXBwZW5kQ2hpbGQobm9kZXMuZGV0YWlsKTtcbiAgICB9XG4gIH1cblxuICAvKlxuICAgKiBBZGQgdGhlIGhpc3RvcnkgZWxlbWVudHNcbiAgICovXG4gIGZ1bmN0aW9uIHdpZGdldEhpc3RvcnlFbGVtZW50KCl7ICBcbiAgICBpZihkYXRhLmJhZGdlID09ICdvY3RvJyl7XG4gICAgICBub2Rlcy5oaXN0b3J5ID0gZWwoJ2RpdicpO1xuICAgICAgbm9kZXMuaGlzdG9yeS5jbGFzc05hbWUgPSAnaGlzdG9yeSc7XG4gICAgICBub2Rlcy5oaXN0b3J5LmlkID0gJ2dpdGh1Yi1iYWRnZS1oaXN0b3J5JztcblxuICAgICAgdmFyIGRheSA9IG5ldyBEYXRlKCk7XG4gICAgICBkYXkuc2V0SG91cnMoMCwwLDAsMCk7XG4gICAgICBkYXkuc2V0RGF0ZShkYXkuZ2V0RGF0ZSgpLTI5KTtcbiAgICAgIHZhciBEQVlTX09GX0hJU1RPUlkgPSAzMDtcblxuICAgICAgZnVuY3Rpb24gcGFkRGlnaXRzKG51bWJlciwgZGlnaXRzKSB7XG4gICAgICAgIHJldHVybiBBcnJheShNYXRoLm1heChkaWdpdHMgLSBTdHJpbmcobnVtYmVyKS5sZW5ndGggKyAxLCAwKSkuam9pbigwKSArIG51bWJlcjtcbiAgICAgIH1cblxuICAgICAgZGF0YS5oaXN0b3J5ID0ge2RheXM6IHt9fTtcbiAgICAgIGZvcih2YXIgaT0wO2k8REFZU19PRl9ISVNUT1JZO2krKyl7XG4gICAgICAgIHZhciBkYXRlID0gW2RheS5nZXRGdWxsWWVhcigpLCBwYWREaWdpdHMoKGRheS5nZXRNb250aCgpKzEpLCAyKSwgcGFkRGlnaXRzKGRheS5nZXREYXRlKCksIDIpXS5qb2luKCctJylcbiAgICAgICAgdmFyIGRheUVsID0gZWwoJ2knKTtcbiAgICAgICAgZGF0YS5oaXN0b3J5LmRheXNbZGF0ZV0gPSB7XG4gICAgICAgICAgZWw6IGRheUVsLFxuICAgICAgICAgIHZhbHVlOiAwXG4gICAgICAgIH07XG4gICAgICAgIGRheUVsLnNldEF0dHJpYnV0ZSgnZGF0YS1kYXRlJywgZGF0ZSk7XG4gICAgICAgIGRheS5zZXREYXRlKGRheS5nZXREYXRlKCkrMSk7XG4gICAgICAgIG5vZGVzLmhpc3RvcnkuYXBwZW5kQ2hpbGQoZGF5RWwpO1xuICAgICAgfVxuXG4gICAgICB3aWRnZXQuYXBwZW5kQ2hpbGQobm9kZXMuaGlzdG9yeSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBzdW1tYXJ5OiB3aWRnZXRTdW1tYXJ5Q29sdW1uRWxlbWVudHMsXG4gICAgZGV0YWlsOiB3aWRnZXREZXRhaWxFbGVtZW50cyxcbiAgICBoaXN0b3J5OiB3aWRnZXRIaXN0b3J5RWxlbWVudFxuICB9XG59XG4iLCIvKlxuICogQWRkIG9jdG9kZXggdG8gdGhlIHdpZGdldFxuICovXG5mdW5jdGlvbiB3aWRnZXRPY3RvZGV4KHdpZGdldCwgb2N0b2RleCl7XG4gIG9jdG9kZXguY2xhc3NOYW1lID0gJ29jdG9kZXgnO1xuICBvY3RvZGV4LndpZHRoID0gJzMwJztcbiAgb2N0b2RleC5zcmMgPSAnZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFESUFBQUF5Q0FZQUFBQWVQNGl4QUFBSzQwbEVRVlI0QWUzYUNWQlc1YjhIOEVkSi9hZTRLMm91bUVnYWFtbG9hUzZhcG1XbUU1V1ZtVXRXV2xxWWRoVngwWXhjQUZFWk5UQkZWQkJrUVZRRU5CUmxSeEFWUk1WQVpaZUZkK2NGQk9GN3YvZk1HZWFOWktJdUwzT251YitaejV6emNzNTUvWDJmNXpuUE9Bd0N3TC9DdnlmSVB5Z2I4cVlsTklDYW84em9FL0toeGRRaTVVeGF1a1IyMUlQK04yVktLeWlVZE9SRlJxODJsRUV3VUVJYnFhM0JmWDFwTEwxTEg5RDdOSXZHVUMrRCs1YlRRNEtCU3VwR1JxMytWRUY0aWlRNlFMZElTMmlFbW1Jb2p0Q0lTV1RVc2lLMGdBL0pxUFU4MVJDTWJCSVp2YUlJUnFTbDltVFVha3MzQ0VaVVExdklxT1ZKTUM3akw2L1JoQlowazR4U3h3Z3RiSnd4M28wOFFndmJSTTFhbGxSTmFHaWtsU1cyMnErQWovczJCQjdhQ1YrM24rRzJZeTIycmY0UzlsOStqSldmdllkVkM5N0h4bVdmd3RIdWF4eDIyUUMvZzl0eHlzTUpYcngzbmUzbkdORGJyTEVnUHRTc05ZYlEwT292UGdiMDl3RE5UYUFnQnNpbjBoUkFuUTZvVW1XOHBwVFBDZW8wb093NnBIc0xZNEh5TkdnZlhjUGtzYU9lRmlTSW1yVmVvaWNFR1daUG53aDJBdHc2QjMxU0NLU3Exa0J6eFF2YW1KUFFYVDB0S1U4Nkk1RStKd1pER3hjSVRjUVJCbjRBc0twdVJ3UFprYWhXM01RUUMvT0dRZnlvV1dzQTZRaUVaOXUxUlM0YlFrRUNkTkVuZ1pySFNQVS9pUWR4OFlDK0RMb3J4MUdlZkZZT1lTQTVCSnJMeDFHcnpFWlpkaTZTRHJtaHVrS1BpcFF3UUplS29NTk9EWU1jcDJhdGRwUlBJTHd4ZmpSUWtvS2FhRzlBWDRETXlFdHdNZStDWHllTWhESy9BTFU1U2RERm52eHprTVJUcUxvWnl0d1ZDRmowQ2JaMUVZaDNPd0RVbGdOcFo2Ry9HWTRlM1RvYkJ0a3RqRkJuQ0lTNTcwNlQxbjBWZ3dEVmlISnh3ckVaNCtBeDhXV2tuam9ONkFxZ2pmSnFHRVJhY3NoUGdTSWpIWjdUWDRmMzdDbndXelFQMWNwaTRQWjUxR1Zjd3N0V2xvWkJsbEtUcXdQMW9YNWtRYS9RS0JwT0kyZ1lkYWNmQ1lRM0o3MEtGRjNERXltSUZzbkhqbUR2WURNY0dHV0JuT1Jrb0N5RFFVNUk3MFhsalRCVVhnK1Z6blh4QVhoeTd3cFhYd21PdmowSnV3WjBRcWpkRDBCdEJaRE9lNUxPb25mM0xvWkIzaWN6dVljUmNrK2o1QjR0cUQ4OVI2WWt4dEJZZWtHKzhCSlp5dytNcEhIeXRTa0U0dlIzUVdYNmIwQjZPS3JTTDZKU3EwSHcwb1dJMnVXSXVwb3E2Qk1EVU03Rzlad0ZmVExKN3d2Zkd3WmsrQm9OMGtOQ2NNSm1Ca3F6SHFBbVB4VzRmeEhwRWQ2R0lVcmxYbDZXZXhncDkyUXQvM3dBV2RJNE9ZUG9hVEQ2TDhvM2pwWkh3VnkrZWJDY2VoT0I0TDdURGtBQk5PRy9vaWJuT3FTcXEwYkZ6UXZRUnZ0d0JzNEFlUW00WXI4Y1NVNzJRRUVpdEFuL3MydjU4MTBKQkI1cklUMVNrZ2x0K0NFQUQ3Rnp3d3JESU45VFI3S1FlekNYK3hzajl6alVvRzh6a3BKT29HRnlxQTdVbWhxcllFSzN6aDF4Sy80VWdCeFVKdmloZ28yWEp3UkJFK01yN1U3NmxCQW9ydmloS05JWGp5SzhvSXJ4NSs1MER1WFhRcUJqR0YwOFB5ZWZnNWE3R0NvemtKMTJIajI3MWkrckM5Ull0YWIyMUYwT05rR2F0YVpVcTFhdEpBYmxUZWpRcmgyOFBYY0JxalJBZVFNb1RBU3lvb0U3RWNDRGFKU0dIc1c5bzd1UTRlRUkzV1ZmWHJzQzNMb0FaRVFDOTZPQTRpVGdjU1pTRTA5ajBJQStrRU5FVWpzeWJyVnUzVnJJb1JiVEhjTFlWNFpqaDhNUGlQVS9nUHlZQUtqVEwrREp3MWhBY1FOYWpuVEZ2VXZTT1hMajhUZ3JDb3JVY0R5OGVBS25qN2xneVdjMk1CRlNnR0xhU3Eyb2VhcFh6NTZpQzNVMzZ5bmFkK3RxMXRHMGZlelVkOTgrM2JGekoydVQxaWJDeE1Ta2ZySm9OdTJsRkNycjFNbTB6R0pnWDFpUEdJcngxc014ZGZKcmVHUGlHSXhuMkhIRTdSWDkrL1ZXdG0zYlZpbi9SdVlZTGFZZTFEejFyS21wMkI0V0poTDFGU0tNSXVpeVdtMHlmZjZuNjRZTUc0cXYxdGpDM0dMUTdMLzRkZEZXd2wvWVRSM0lSQmlqNXRvNWlBUkErSlpBK0pGUE1VU1lEZ3ZDYS9BcDE5T3JBd2NQd2dlZmYxWmwycWxqTDhIaXFJcG4yclNSbHB0Y1EwaEIrQXNxc2paS2lONkRMTVhoVExVNG5sY2hEdDVWMVhOTlU3d1ZEeXhaZjl4VHNGeW56WjZKQmQ4dVM1QzJScm5NbnVzamhneTNFcXh6aENhS05Fb1FpMUd2aWtBTnhPSGZ0YVN1OTB1NlFzUUF3aUU0VU9xNVRaczJtRGJuSGJ4bE0rZGhuLzU5SGNobTNOVEp5K2ZNK3lqUW9Na2l5aWRRS0FVUVNFRXFnbnpzUk0xYjVzTkhDdS9DV25Ia3ZrNE9JY3NzRjRHbFZjTDhSVXNobHdOaDBCQkxqSmswSG1PblRwYU9nNjJHd2lESVl0cExvSzFrU3lBdldrRWdEZlZyMFNBQkpWV2luK1h6d3FCMlVSMmhFVy9SZm9JY2FET0JmR2tXZ2RUVVJ6eWwrZ3l5RUxPLy9VNU1YYkJVdkxub0d6Rmp5WEpqekVoOWphQTE1Q1lIKzQ0ZUVjaUczQW55TlhzQ0JkS0hCTkkwRE5KendQUGk4NTB1d3F0QUpTNEJJclFXSWh3UVVXVG5HeUl0LzM4ZUpFc3Znc29laS9hbXo0Z21WTDVCRURjQ09kSmFBZ1hRM0tjRkdUbHRoamg0cDB5Y0I0VFBJNGhmN3lybEhsVGkwRDJWT0ZNRjRhK0FXSDdBVy9TMUhDWWFyZitZZGhZbml2Q25JQWN6Tk1LL3VFS3NkRDhxbGppNWlRL1gvaVE2OVRBVEhidjFrRXo4YUo3ZzFpeFlQYWlNUUxQcEFJRitNbmhIL09TUUlDMUpRVmI4NGltTlBnZVNZVlRTdjl1QUZPeFlUaVVEUWRxVTN2bmFsdHQrZzhIdFpXNGh2bmI5UlJ6TnJoUWVXWC9jdFRnYTB2RjBoVFRWMHRFdHZWaTQzU3FTaEFQaW0zM0hCZE9RS0NCWWpaODZzM1BQM3E0OHgzT0RYM0RzTjhSS21wR3V2ZnI0dmpSbCtudHlFTVh3aVpQRWVyOGdFVklERG1ENVV3TElHdlRqbFZjcGd2VVF6dEZwWXZyaVpVS3ExMjNtQ1plNGV5SVNFSWN5bEkwOHpLTkVKVHd5TmNJcnY2YWVCNWZlK1RxTTJCZWJzcVROZjlycmhCQlk1MzhoYmVaWDMwdkxiTmFLbGFwNW14d1VQTWZrZVl0S053U0czZVU1V2ovVDlyRnZYc202T0dDYVc3cWk2MkY1d0pvWWhuMW9SYUFhMHJ1MDBNRlZTS1BoVXdST3FSeWk2VjdqRjdxNHBhdlNrNEZhNTR1eDlidVc0MjlSbUdBelZ6cGZzSDRMbGpudWtjNUhUSndDNTBqNVByTDNDY0JWQUFmdnFnczRpT2Y0blF1b1E1TURaYWg0MUlyZ2NvaS8xYnhzRUFVUlBMSjA0SnJGd3EwYjY1djdhdU5tK09jVW81WDhlWGRFTE53VHI5ZGY5OG5NeC9jN25ldXZ6MTJ6Q21jcWdTUDM5ZUIzZ3U3VDRyL1owOThPTW9LS0NRUnVEQWhTVjJPbXJSUEd6VnVMYlpFSlNBWmc5ZG9ZcWNuM2JML0R1VG9nSE1BbjluYlN6OHhmR0l6NHVqbzR4U1ZqL1B4MW1MYjBKd1FvcW5IMGdSVEVrSk14Z3lRVFpPRFN3dUVNSlh6S2dIMVpnUE10d0NHMkVCUG1yOFV5OTdNSWV3SjQ1ZWx4TkZ1SDhGcmdXODhMR1B2eEtteTY5QkF1dHdIWExNQkhBUnkrcDhRaGFoQUVOS2tsZ3NoaDFEaVJwNFg3YlFWV0IrZGc3YmxDdUdjRGpqZUJ6WmRLNFptbHdyRUhhbXpoK2ZZVXdEMFhXQmRXaEZXbnNzSC94OEUzWDh2dmFCaWcza1JqQlhtUmxBUkRSN0kwa2swUmhReVNoejBwSmRnYVdRamJ3QnpzUzFXd1lTVldCdVZpeThVQzdMbFdBcnZRZkd6OHJSQWVtV3A0M3RjMEZzTEJhRXRMWmtIK0JGbDlNd3lDL3pxYmgvMXNma2RjTVZZRjUySlhVaWwyWHl2RDZ0TjUyQlpUREFaaldDa0l1RFNmRmlTREZobjdaVGMwbXJaVFBKdDV6Q09iSzJERHVkZ25CMkh6Y0w0cUJjRVBaK3FETUd3K05sejRRNUE4OHFUNTFJNUVTd2FweDJVMWtNYzVQMFkrV204ZlhuQnlmNW9pZ1VIdXNQbUh6bGRMOGx5U3kvSTRVN2tNOGp1RDNGaC92aUJpNitXaVBYdzN2bUFRYXo3YmtVVFRHUytJWUZPdEhLS0tCbTYrV0RqcndDMmw3WTY0a2g4NThyczRJNjVjWHE1clF2TDNibzh0M3JZL1RibU85eXo4T2JyWW1zOTA0YlBOMHNQLy83M1cvelgvRGZSRWJuNTh1Uk1iQUFBQUFFbEZUa1N1UW1DQyc7XG4gIHdpZGdldC5hcHBlbmRDaGlsZChvY3RvZGV4KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB3aWRnZXRPY3RvZGV4O1xuIiwiLyoqXG4gKiBMb2FkIGFuZCBjYWNoZSBKU09OUCBkYXRhXG4gKi9cbnZhciBsb2FkSlNPTlAgPSBmdW5jdGlvbiAoIHVybCwgY2FsbGJhY2sgKSB7XG4gIHZhciBzZXRMb2NhbERhdGEgPSBmYWxzZTtcblxuICAvL2xvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKHVybCk7XG4gIFxuICAvKlxuICAgKiBTZXR0aW5nIGEgdmFyaWFibGUgY2FsbGJhY2sgbWV0aG9kIHNpbmNlIHdlJ3JlIHdyaXRpbmcgdG8gd2luZG93XG4gICAqL1xuICB2YXIgY2FsbGJhY2tNZXRob2QgPSB1cmwucmVwbGFjZSgvW15hLXpBLVowLTldL2csICdfJylcbiAgLypcbiAgICogU2VuZCBkYXRhIHRvIHRoZSBjYWxsYmFjayBmdW5jdGlvbiwgY2FjaGluZyBkYXRhIGlmIG5lZWRlZFxuICAgKi9cbiAgd2luZG93W2NhbGxiYWNrTWV0aG9kXSA9IGZ1bmN0aW9uKGRhdGEpe1xuICAgIGlmKHNldExvY2FsRGF0YSl7XG4gICAgICAvL0NhY2hlIGZvciAxIGRheVxuICAgICAgdmFyIGQgPSBuZXcgRGF0ZSgpO1xuICAgICAgZC5zZXREYXRlKGQuZ2V0RGF0ZSgpKzEpO1xuXG4gICAgICB0cnkge1xuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSh1cmwsIEpTT04uc3RyaW5naWZ5KHtleHBpcnk6IGQuZ2V0VGltZSgpLCB2YWx1ZTogZGF0YX0pKTtcbiAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiQ291bGQgbm90IGFkZCBpdGVtIHRvIGxvY2FsIHN0b3JhZ2UuLi5jbGVhcmluZyBsb2NhbFN0b3JhZ2UuLi5cIiwgZSk7XG4gICAgICAgIGxvY2FsU3RvcmFnZS5jbGVhcigpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHdpbmRvd1tjYWxsYmFja10oZGF0YSk7XG4gIH1cblxuICAvKlxuICAgKiBNYWtlIHRoZSBKU09OUCByZXF1ZXN0XG4gICAqL1xuICBmdW5jdGlvbiByZXF1ZXN0RGF0YUZyb21SZW1vdGUoKXtcbiAgICAvLyBDcmVhdGUgc2NyaXB0IHdpdGggdXJsIGFuZCBjYWxsYmFjayAoaWYgc3BlY2lmaWVkKVxuICAgIHZhciByZWYgPSB3aW5kb3cuZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoICdzY3JpcHQnIClbIDAgXTtcbiAgICB2YXIgc2NyaXB0ID0gd2luZG93LmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdzY3JpcHQnICk7XG4gICAgc2NyaXB0LnNyYyA9IHVybCArICh1cmwuaW5kZXhPZiggJz8nICkgKyAxID8gJyYnIDogJz8nKSArICdjYWxsYmFjaz0nK2NhbGxiYWNrTWV0aG9kO1xuXG4gICAgLy8gSW5zZXJ0IHNjcmlwdCB0YWcgaW50byB0aGUgRE9NIChhcHBlbmQgdG8gPGhlYWQ+KVxuICAgIHJlZi5wYXJlbnROb2RlLmluc2VydEJlZm9yZSggc2NyaXB0LCByZWYgKTtcblxuICAgIC8vIEFmdGVyIHRoZSBzY3JpcHQgaXMgbG9hZGVkIChhbmQgZXhlY3V0ZWQpLCByZW1vdmUgaXRcbiAgICBzY3JpcHQub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnJlbW92ZSgpO1xuICAgIH07XG4gIH1cblxuICB2YXIgc3RvcmVkID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0odXJsKTtcbiAgaWYoc3RvcmVkKXtcbiAgICB2YXIgbm93ID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcbiAgICB2YXIganNvbiA9IEpTT04ucGFyc2Uoc3RvcmVkKTtcblxuICAgIGlmKGpzb24uZXhwaXJ5ID4gbm93KXtcbiAgICAgIHdpbmRvd1tjYWxsYmFja01ldGhvZF0oanNvbi52YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKHVybCk7XG4gICAgICBzZXRMb2NhbERhdGEgPSB0cnVlO1xuICAgICAgcmVxdWVzdERhdGFGcm9tUmVtb3RlKCk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHNldExvY2FsRGF0YSA9IHRydWU7XG4gICAgcmVxdWVzdERhdGFGcm9tUmVtb3RlKCk7XG4gIH1cbn07XG5cblxuLypcbiAqIFNob3J0aGFuZCB0byBncmFiIGFuIGVsZW1lbnRcbiAqL1xudmFyIGVsID0gZnVuY3Rpb24ocyl7XG4gIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHMpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbG9hZEpTT05QOiBsb2FkSlNPTlAsXG4gIGVsOiBlbFxufVxuIl19
