(function() {
  var notification_template = '';
  
  // Load template
  $.ajax({
    url: chrome.extension.getURL('templates/notification.html'),
    complete: function(xhr) {
      notification_template = xhr.responseText;
    }
  });
  
  // Public. Returns topic url.
  function getTopicUrl(topic) {
    if (topic && topic.db) {
      if (topic.db.type == "project") {
        return "http://tadagraph.com/#/" + topic.db.name + "/" + topic._id +"/";
      } else if (topic.db.type == "team") {
        return "http://tadagraph.com/#/+" + topic.db.name + "/" + topic._id +"/";
      } else if (topic.db.type == "location") {
        return "http://tadagraph.com/#/-" + topic.db.name + "/" + topic._id +"/";
      } else {
        return "javascript:return false";
      }
    } else
      return "javascript:return false";
  }
  
  function prepareBody(body, doc, showTopic, hideFirstReply) {
    body = $("<div>").text(body).html();
    body = body.replace(/\n/g, '<br />');
    var regex = /\b(https?:\/\/[^ <]+[^.<])/g;
    body = body.replace(regex, '<a href="$1" target="_blank">$1</a>');
    
    var info = "";
    
    function markTopic(topic) {
        var topic_url = getTopicUrl(topic);
        var tp = new RegExp('\\[' + topic.title.toLowerCase() + '\\]', 'ig');
        var tpRaw = '[' + topic.title + ']';
        if (body.search(tp) >= 0) {
            body = body.replace(tp, '<a href="' + topic_url + '" target="_blank">' + tpRaw + '</a>');
        } else if (showTopic) {
            if (info) info += " ";
            info += '<a href="' + topic_url + '" target="_blank">' + tpRaw + '</a>';
        }
    }
    
    if (doc.topic) {
        markTopic(doc.topic);
    }
    
    if (doc.topics) {
        doc.topics.forEach(function(topic) {
            markTopic(topic);
        });
    }
    
    if (doc.parent) {
        if (doc.parent.created_by.nickname) {
            var selfReply = doc.parent.created_by.id == doc.created_by.id;
            var index = body.search("@" + doc.parent.created_by.nickname + "\\b");
            if (index == -1 && !hideFirstReply && !selfReply) {
                // Do not insert reply if message starts from reply.
                if (body.search(/@[a-z0-9-_]+/i) != 0)
                
                    // Show parent message owner if he is not specified in reply.
                    body = "@" + doc.parent.created_by.nickname + " " + body;
                    
            } else if ((hideFirstReply || selfReply) && index == 0) {
            
                // Hide reply referrer if needed.
                body = body.substr(doc.parent.created_by.nickname.length + 1);
            }
        }
    }
    
    if (info) {
        body += ' <span class="topic">~&nbsp;' + info + '</span>';
    }
    if (doc.info) {
        body += ' <span class="topic">~&nbsp;'+ doc.info + '</span>';
    }
    
    body = body.replace(/(^|\s)(@[a-z0-9-_]+)/gi, '$1<a href="#" onclick="return false;">$2</a>');
    
    body = body.replace(/\B(#([a-z0-9-_]+))/gi, '<a href="http://tadagraph.com/#/' + doc.db.name + '/#$2">$1</a>');
    
    return body;
  }
  
  function render(notification) {
    if (!notification.created_by) return;
    
    if (notification.created_by.id && notification.created_by.nickname) {
      var created_by_id = notification.created_by.id,
          created_by_nickname = notification.created_by.nickname;
    } else {
      var created_by_id = notification.created_by,
          created_by_nickname = notification.created_by;
    };

    return 'data:text/html;charset=utf-8;plain,' + encodeURIComponent($.mustache(
      notification_template,
      {
        image: 'http://tadagraph.com/api/people/' + created_by_id + '/avatar',
        created_by_nickname: created_by_nickname,
        body: prepareBody(notification.body, notification.ref)
      }
    ));
  }
  
  var has_seen = {};
  
  $.notification = function(data) {
    // Throw away all duplicates
    if (has_seen[data._id]) return;
    has_seen[data._id] = true;
    
    var html = render(data),
        notification = webkitNotifications.createHTMLNotification(html);
  
    notification.show();
    // Auto-close it after 15 seconds
    setTimeout(function() {
      notification.cancel();
    }, 15000);
  };
  
})();
