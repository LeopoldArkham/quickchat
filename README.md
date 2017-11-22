# quickchat

A proof-of-concept chatroom service using Node.js, Express, and Socket.io.  
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

## Features:
- Multi-room
- Username support
- Rooms can be password protected
- Shows connected users

## Paths to improvement:
- Notify new messages in tab.
- Ping user
- Auto-detect urls's in messages and linkify them.
- Cleaner, responsive UI.
- Security: Persist room data on disk so that previously password protected rooms
can't be accessed publicly if the server restarts.
- Allow room creator to destroy a room.
- Factor out common code for protected and public chatrooms.
- Send and display error messages when trying to overwrite an existing room- or username.
- Persist last ~20 messages to give newcomers context on the conversation.
- Security: Audit the password situation: Can password sending be made safer?
No point in hashing it on the client side (as I initially did), since the server would then
simply expect the hash that the attacker intercepted.
- CLI or web-based dashboard with simple analytics
