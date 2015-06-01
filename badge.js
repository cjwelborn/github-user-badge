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
