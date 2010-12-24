(function() {
  
  $.bouncingIcon = function() {
    var context = $('#bouncer'),
        img = $('img', context)[0],
        canvasContext = $('canvas', context)[0].getContext('2d'),
        rotation = 0,
				animationFrames = 36,
				animationSpeed = 10,
        spoofF = false,
				spoofPositive = false;
        
    function ease(x) {
      return (1-Math.sin(Math.PI/2+x*Math.PI))/2;
    }
    
    function animateFlip() {
      rotation += 1/animationFrames;				
      (spoofF ? (spoofPositive ? drawSpoofPositive: drawSpoofNegative) : drawIconAtRotation)();

      if (rotation <= 1) {
        setTimeout(animateFlip, animationSpeed);
      } else {
        rotation = 0;
        (spoofF ? (spoofPositive ? drawSpoofPositive: drawSpoofNegative) : drawIconAtRotation)();
      }
    }

    function drawIconAtRotation() {
      canvasContext.save();
      canvasContext.clearRect(0, 0, 19, 19);
      canvasContext.translate(19/2, 19/2);
      canvasContext.rotate(2*Math.PI*ease(rotation));
      
      canvasContext.drawImage(img, -img.width/2, -img.height/2 );
      canvasContext.restore();

      chrome.browserAction.setIcon({imageData:canvasContext.getImageData(0, 0, 19, 19)});
    }
    
    function drawSpoofPositive() {
      canvasContext.save();
      canvasContext.clearRect(0, 0, 19, 19);
      canvasContext.translate(19/2, 19/2);
      var d = Math.abs(rotation-0.5);
      canvasContext.scale(1.5 - d,1.5 - d);
      
      canvasContext.drawImage(img, -img.width/2, -img.height/2 );
      canvasContext.restore();

      chrome.browserAction.setIcon({imageData:canvasContext.getImageData(0, 0, 19, 19)});
    }
    
    function drawSpoofNegative() {
      canvasContext.save();
      canvasContext.clearRect(0, 0, 19, 19);
      canvasContext.translate(19/2, 19/2);
      var d = Math.abs(rotation-0.5);
      canvasContext.scale(0.5 + d,0.5 + d);
      
      canvasContext.drawImage(img, -img.width/2, -img.height/2 );
      canvasContext.restore();

      chrome.browserAction.setIcon({imageData:canvasContext.getImageData(0, 0, 19, 19)});
    }
      
    return {
      bounce: function() {
        animateFlip();
      }
    };
  }
})();
