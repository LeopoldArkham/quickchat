import React, { Component } from "react";
import io from "socket.io-client";
import "./App.css";

class RoomCreateForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      roomName: "",
      pw: ""
    };

    this.updateRoomName = this.updateRoomName.bind(this);
    this.updatePw = this.updatePw.bind(this);
    this.handleCreate = this.handleCreate.bind(this);
  }

  updateRoomName(e) {
    this.setState({ roomName: e.target.value });
  }

  updatePw(e) {
    this.setState({ pw: e.target.value });
  }

  handleCreate(e) {
    // alert(this.state.roomName + " " + this.state.pw);
    this.props.handle(this.state.roomName, this.state.pw);
  }

  render() {
    return (
      <div id="prompt">
        <form action="" id="create-room">
          <input
            onChange={this.updateRoomName}
            autoComplete="off"
            placeholder="Room name"
            id="room-name"
            autoFocus
          />
          <input
            onChange={this.updatePw}
            autoComplete="off"
            placeholder="Password, leave blank for a public room"
            id="pw"
          />
          <button onClick={this.handleCreate}>Create</button>
        </form>
      </div>
    );
  }
}

class RoomJoinForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      userName: "",
      pw: ""
    };

    this.updateUserName = this.updateUserName.bind(this);
    this.updatePw = this.updatePw.bind(this);
    this.handleJoin = this.handleJoin.bind(this);
  }

  updateUserName(e) {
    this.setState({ userName: e.target.value });
  }

  updatePw(e) {
    this.setState({ pw: e.target.value });
  }

  handleJoin(e) {
    e.preventDefault();
    const s = this.state;
    this.props.handle(s.userName, s.pw);
  }

  // Returns a passsword field if logging into a protected room
  pw_field() {
    if (this.props.protected === true) {
      return (
        <input
          onChange={this.updatePw}
          autoComplete="off"
          placeholder="Password"
          id="password"
        />
      );
    } else {
      return null;
    }
  }

  render() {
    return (
      <div id="prompt-bg">
        <form action="" id="username-form">
          <input
            onChange={this.updateUserName}
            autoComplete="off"
            placeholder="Username"
            id="username"
            autoFocus
          />
          {this.pw_field()}
          <button onClick={this.handleJoin}>Join</button>
        </form>
      </div>
    );
  }
}

class Chat extends Component {
  constructor(props) {
    super(props);
    this.state = {
      message: ""
    }

    this.send = this.send.bind(this);
    this.updateMessage = this.updateMessage.bind(this);
  }
  
  nbUsers() {
    let pluralized = this.props.nb > 1 ? "users":"user";   
    return (<span id="nb_users">{this.props.nb} {pluralized} connected</span>);
  }

  send(e) {
    e.preventDefault();
    const msg = this.state.message;
    this.setState({message: ""});
    this.props.handle(msg);
  }

  updateMessage(e) {
    this.setState({ message: e.target.value});
  }

  render() {
    return (
      <div id="chat">
        <div id="top">
          <span>
            {this.nbUsers()}
          </span>
        </div>
        <ul id="messages">
          {this.props.messages.map(function(msg, index) {
            console.log(msg);
            return <li key={index}><i>{msg.uname}:</i> {msg.msg}</li>
          })}
        </ul>
        <form id="text-input" action="">
          <input value={this.state.message} onChange={this.updateMessage} id="m" autoComplete="off" />
          <button onClick={this.send} >Send</button>
        </form>
      </div>
    );
  }
}

// Weak state machine to store the current step of the creation/login/chat pipeline
var RenderStep = {
  RoomCreation: 0,
  ProtectedLogin: 10,
  Login: 11,
  Chat: 20
};

Array.prototype.last = function(){
  return this[this.length - 1];
};

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      renderStep: RenderStep.RoomCreation,
      room: "",
      nb_users: 0,
      messages: []
    };
    const PORT = process.env.PORT || 5000;
    this.socket = io("http://localhost:" + PORT);

    this.handleCreateRoom = this.handleCreateRoom.bind(this);
    this.handleJoinRoom = this.handleJoinRoom.bind(this);
    this.handleSend = this.handleSend.bind(this); 
  }

  componentDidMount() {
    this.socket.on("nb_users", this.updateUsers.bind(this));
    this.socket.on("auth-ok", this.auth_ok.bind(this));
    this.socket.on("msg", this.recieveMessage.bind(this));
    this.socket.on("is-protected", this.handleProtected.bind(this));

    // fragile.
    var room = window.location.href.split('/').last();
    if (room.length > 0) {
      // Joining a room
      this.setState({room: room});
      this.socket.emit("check-protected", room);
    } else {
      // Creating a room
      this.setState({renderStep: RenderStep.RoomCreation});
    }
    
  }

  updateUsers(nb) {
    console.log("success");
    this.setState({ nb_users: nb });
  }

  auth_ok() {
    if (this.state.renderStep !== RenderStep.ProtectedLogin) {
      console.warn(
        "State machine invariant violated: auth-ok outside of ProtectedLogin."
      );
    }
    this.setState({ renderStep: RenderStep.Chat });
  }

  recieveMessage(uname, msg) {
    this.setState({ messages: [...this.state.messages, { uname, msg }] });
  }

  handleProtected(is_protected) {
    if (is_protected) {
      this.setState({renderStep: RenderStep.ProtectedLogin});      
    } else {
      this.setState({renderStep: RenderStep.Login});      
    }
  }

  handleCreateRoom(room, pw) {
    this.setState({ room: room });
    if (pw.length > 0) {
      this.socket.emit("room-with-pw", room, pw);
      this.setState({ renderStep: RenderStep.ProtectedLogin });
      return;
    } else {
      this.setState({ renderStep: RenderStep.Login });
    }
  }

  handleJoinRoom(uname, pw) {
    const s = this.state;
    if (s.renderStep === RenderStep.ProtectedLogin) {
      this.socket.emit("join-protected", s.room, uname, pw);
    } else if (s.renderStep === RenderStep.Login) {
      this.socket.emit("join", s.room, uname);
      this.setState({ renderStep: RenderStep.Chat });      
    } else {
      console.warn(
        "State machine invariant violated: Join called incorrectly."
      );
    }
  }

  handleSend(msg) {
    this.socket.emit("msg", msg);
  }

  render() {
    switch (this.state.renderStep) {
      case RenderStep.RoomCreation:
        return <RoomCreateForm handle={this.handleCreateRoom} />;

      case RenderStep.ProtectedLogin:
        return <RoomJoinForm handle={this.handleJoinRoom} protected={true} />;

      case RenderStep.Login:
        return <RoomJoinForm handle={this.handleJoinRoom} protected={false} />;

      case RenderStep.Chat:
        return <Chat nb={this.state.nb_users} messages={this.state.messages} handle={this.handleSend}/>;
      
      default:
        console.warn("State machine invariant violated: Not a valid step.");
        break;
    }
  }
}

export default App;
