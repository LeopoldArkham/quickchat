// JavaScript somehow lacks this.
Array.prototype.last = function(){
    return this[this.length - 1];
  };

  // Get username
  var username = "";
  $("#username-form").submit(function() {
    if ($("#username").val().length > 0) {
      username = $("#username").val();
      $("#prompt-bg").fadeOut(250);
      $("#m").focus();
    } else {
      return false;
    }
    $(function() {
    // Parse and set room ID
    var url = window.location.href;
    var room = url.split('/').last();
    $('#roomID').text(room);

    var socket = io();
    socket.emit('join', room, username);
    
    // Send messages to server and clear input field.
    $('#text-input').submit(function() {
        var _uname = $('#uname').val();
        var _msg = $('#m').val()
        socket.emit('msg', _msg);
        $('#m').val('');
        return false;
    });
    
    // Propagate new message
    socket.on('msg', function(_uname, _msg) {
      $('#messages').append('<li><i>' + _uname + ':</i> ' + _msg  + '</li>');
    })
    
    // Update connected users
    socket.on('nb_users', function(nb) {
      let pluralized = nb > 1? "users":"user";
      $('#nb_users').text(nb + " " + pluralized);
    })
  });
  return false;
  });