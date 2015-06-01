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
