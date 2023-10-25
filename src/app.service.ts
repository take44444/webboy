import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getEmulator(): string {
    return `<!doctype html>
    <html>
        <head>
            <script src="https://cdn.socket.io/4.3.2/socket.io.min.js" integrity="sha384-KAZ4DtjNhLChOB/hxXuKqhMLYvx3b5MlT55xPEiNmREKRzeEm+RVPlTnAn0ajQNs" crossorigin="anonymous"></script>
            <script>
                const socket = io('http://localhost:3000');
                socket.on('connect', (data) => {
                  console.log('connected!');
                });
                socket.on('onMessage', (data) => {
                  console.log(data);
                });
                socket.connect();
                socket.emit('con', 'abc');
                setTimeout(()=>{socket.emit('discon');}, 2000);                
            </script>
        </head>
        <body>
        </body>
    </html>`;
  }
}
