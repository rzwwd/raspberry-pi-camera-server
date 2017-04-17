import React from 'react';
import ReactDOM from 'react-dom';
import createReactClass from 'create-react-class';
const driveCar = false;


const Home = createReactClass({
    getInitialState() {
        return {
            socket: null,
            status: false,
            fps: 0
        };
    },
    componentDidMount(){
        let _this = this;
        const socket = io('http://'+self.location.hostname+':2281');
        const joystick = require('nipplejs').create({
            zone: this.refs.joystick,
            mode: 'static',
            position: {left: '50%', bottom: '130px'},
            color: '#ffffff',
            maxNumberOfNipples: 2,
            size: 140
        });
        this.refs.stream.style.display = "none";
        this.refs.joystick.style.display = "none";
        this.refs.fps.style.display = "none";

        joystick.on('move', function(evt, data) {
            /*
                MAX DISTANCE = 70
                up = 0
                down = 1
                left = 2
                right = 3
             */
            let state = {
                direction: null,
                value: null
            };
            if(data.direction){
                if (data.direction.angle==="up"){
                    state.direction = 0;
                }
                else if (data.direction.angle==="down"){
                    state.direction = 1;
                }
                else if (data.direction.angle==="left"){
                    state.direction = 2;
                }
                else if (data.direction.angle==="right"){
                    state.direction = 3;
                }
                state.value = data.distance;
                socket.emit("move", state);
            }

            /*
            let xhr = new XMLHttpRequest();
            xhr.open('POST', "http://localhost:2283/move", true);
            xhr.send(JSON.stringify(state));
            */
        });

        let startTime = new Date().getTime();
        let i = 0;
        socket.on('liveStream', function(data) {
            if(new Date().getTime() - startTime >= 1000){
                startTime = new Date().getTime();
                //console.log(i + " fps");
                _this.setState({fps: i});
                i = 0;
            }
            i++;

            _this.refs.stream.src='data:image/jpeg;base64,'+data;
        });

        this.setState({socket: socket});
    },
    render: function () {
        return (
            <div className="mainWindow">
                <header>Raspberry Pi camera</header>
                <div className="body">
                    <img className="streamImage" ref="stream"/>
                    <div ref="joystick"/>
                </div>

                <div className="fpsBlock" ref="fps">{this.state.fps} fps</div>
                <footer ref="footer" onClick={this.startStream}>{!this.state.status ? "Start stream" : "Stop stream"}</footer>
            </div>
        );
    },
    startStream(){
        if (!this.state.status){
            this.state.socket.emit('startStream', 0);
            if (driveCar) this.refs.joystick.style.display = "block";
            this.refs.stream.style.display = "block";
            this.refs.fps.style.display = "block";
            this.refs.footer.style.width = "calc(100% - 100px)";
            this.setState({status: true});
        }
        else{
            if (driveCar) this.refs.joystick.style.display = "none";
            this.refs.stream.style.display = "none";
            this.refs.fps.style.display = "none";
            this.refs.footer.style.width = "100%";
            this.state.socket.emit('stopStream', 0);
            this.refs.stream.src = 'data:image/jpeg;base64,';
            this.setState({status: false});
        }
    }
});


ReactDOM.render(<Home/>, document.getElementById('app') );
