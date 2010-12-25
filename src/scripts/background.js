// Tadagraph API
API = function(CONFIG) {this.CONFIG = CONFIG;};

// Basic API
API.prototype.login = function login(callback) {
  if (!callback) throw Error('callback is required argument');
  
  var that = this;
  
  $.ajax({
    url: this.CONFIG.HOST + '/api/me',
    success: function(data) {
      if (data) {
        callback(data);
        that.online = true;
      } else {
        retry();
        
      }
    },
    error: retry
  });
  
  function retry() {
    setTimeout(function() {
      that.login(callback);
    }, that.CONFIG.LOGIN_TIMEOUT);
    that.online = false;
  }
};

API.prototype.init = function(callback) {
  var that = this;
  this.login(function(username) {
    var db = $.couch.db(username, {type: "user", 
                        urlPrefix: that.CONFIG.HOST + "/api/people",
                        urlSuffix: "couchdb"});
    that.db = db;  
    callback(db);
  });
};

// Notifications API part
API.prototype.getNotifications = function(options) {
  this.db.view("notifier-app/count", $.extend(true, {
    error: function() {
      console.log('API.notifications.count error:', arguments);
    }
  }, options, {
    group: true,
    startkey: ["projects"],
    endkey: ["projects0"]
  }));  
};

API.prototype.notificationsChanges = function(callback) {  
  var changes = this.db.changes(0 , {
    filter: 'core/notifications',
    include_docs: true,
    heartbeat: 10000
  });
  
  changes.onChange(function(response) {
    response.results.forEach(function(result) {
      callback(result.doc);
    });
  });
  
  return changes;
};

// Extension part
(function() {
  var api = new API(CONFIG),
      bouncingIcon = $.bouncingIcon();
  
  api.init(function() {
    function refreshCount() {
      api.getNotifications({
        success: function(response) {
          setBadgeCount(response.rows.reduce(function(total, row){
            return total + (parseInt(row.value) || 0);
          }, 0));
        }
      });
    }
    
    api.notificationsChanges(function(notification) {
      refreshCount();
    });
    
    refreshCount();
    
    setInterval(refreshCount, 30000);
    
  });
  
  function setBadgeCount(count) {
    if (count == parseInt(count)) {
      chrome.browserAction.setBadgeBackgroundColor({
        color: [167, 203, 2, 255]
      });
      
      chrome.browserAction.setBadgeText({
        text: (count || 0).toString()
      });
    } else {
      chrome.browserAction.setBadgeBackgroundColor({
        color: [207, 70, 45, 255]
      });      
      chrome.browserAction.setBadgeText({
        text: '...'
      });
    }
    
    bouncingIcon.bounce();
  }
  
  setBadgeCount('offline');
  
  // Open tadagraph window on click
  chrome.browserAction.onClicked.addListener(function() {
    chrome.tabs.create({
      url: CONFIG.HOST
    });
  });
})();
