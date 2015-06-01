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
