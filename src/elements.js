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
