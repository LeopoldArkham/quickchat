var socket = io();
$("#create-room").submit(function () {
  var roomID = $("#room-name").val();
  var pw = $("#pw").val();

  if (pw.length > 0) {
    socket.emit('room-with-pw', roomID, pw);
  }
  window.location.replace(window.location.href + "rooms/" + roomID);
  return false;
});