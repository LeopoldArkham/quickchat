# quickchat

A proof-of-concept chatroom service using Node.js, Express, and Socket.io.

## Features:
- Multi-room
- Username support
- Rooms can be password protected
- Shows connected users

## Paths to improvement:
- Notify new messages in tab.
- Cleaner, responsive UI.
- Security: Persist room data on disk so that previously password protected rooms
can't be accessed publicly if the server restarts.
- Allow room creator to destroy a room.
- Factor out common code for protected and public chatrooms.
