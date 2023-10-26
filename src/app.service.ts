import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getEmulator(): string {
    return `
    <!doctype html>
    <html>
      <head>
        <title>WEB BOY</title>
      </head>
      <body>
        <p id="me"></p>
        <form action="#" id="connect">
          <input type="text" name="data">
          <input type="submit" value="Connect">
        </form>
        <form action="#" id="disconnect">
          <input type="submit" value="Disconnect">
        </form>
        <p id="connection">Disconnected</p>
        <form action="#" id="send">
          <input type="text" name="data">
          <input type="submit" value="Send">
        </form>
        <p id="received"></p>

        <script src="https://cdn.socket.io/4.3.2/socket.io.min.js" integrity="sha384-KAZ4DtjNhLChOB/hxXuKqhMLYvx3b5MlT55xPEiNmREKRzeEm+RVPlTnAn0ajQNs" crossorigin="anonymous"></script>
        <script>
          const socket = io('http://localhost:3000');
          socket.on('connect', () => {
            document.getElementById('me').textContent = 'You are ' + socket.id;
            console.log('connected!');
          });
          socket.on('leave', () => {
            document.getElementById('connection').textContent = 'Disconnected';
            console.log('leaved');
          });
          socket.on('join', (data) => {
            document.getElementById('connection').textContent = 'Connected to ' + data;
            console.log('joined' + data);
          });
          socket.on('serial', (data) => {
            document.getElementById('received').textContent = 'Received ' + data.toString(16);
          });
          socket.connect();

          const connect = document.getElementById('connect');
          connect.onsubmit = function(e) {
            e.preventDefault();
            socket.emit('join', connect.data.value);
          };
          const disconnect = document.getElementById('disconnect');
          disconnect.onsubmit = function(e) {
            e.preventDefault();
            socket.emit('leave');
          };
          const send = document.getElementById('send');
          send.onsubmit = function(e) {
            e.preventDefault();
            socket.emit('serial', parseInt(send.data.value, 16));
          };
        </script>
      </body>
    </html>`;
  }
}
