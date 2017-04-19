import React from 'react';
import ReactDOM from 'react-dom';
import createReactClass from 'create-react-class';
const driveCar = false;
let socket = NaN;

let moveStatus = 0;
let now_left = 0;
let now_right = 0;
let now_ahead = 0;
let now_back = 0;
let interval_to_move_1_1 = false;
let interval_to_move_1_2 = false;
let interval_to_move_2_1 = false;
let interval_to_move_2_2 = false;
let state = {
    rotate: 0,
    drive: 0
};
let sendInterval = NaN;


const Home = createReactClass({
    getInitialState() {
        return {
            socket: null,
            status: false,
            fps: 0
        };
    },
    componentWillMount: function componentWillMount() {
        if(driveCar === true){
            let _this = this;
            document.addEventListener("keydown", _this.moveByKey, false);
            document.addEventListener("keyup", _this.stopByKey, false);
        }
    },
    componentWillUnmount: function componentWillUnmount() {
        if(driveCar === true){
            let _this = this;
            document.removeEventListener("keydown", _this.moveByKey, false);
            document.removeEventListener("keyup", _this.stopByKey, false);
        }
    },
    componentDidMount(){
        let _this = this;
        socket = io('http://'+self.location.hostname+':2281');
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

        joystick.on("start", function () {
            sendInterval = setInterval(function () {
                socket.emit("move", state);
            }, 1);
        }).on('move', function(evt, data) {
            if(data.direction){
                if (data.direction.angle==="up"){
                    state.drive = data.distance;
                }
                else if (data.direction.angle==="down"){
                    state.drive = -data.distance;
                }
                else if (data.direction.angle==="left"){
                    state.rotate = data.distance;
                }
                else if (data.direction.angle==="right"){
                    state.rotate = -data.distance;
                }
            }
        }).on("end", function () {
            if(interval_to_move_1_1 === false &&
                interval_to_move_1_2 === false &&
                interval_to_move_2_1 === false &&
                interval_to_move_2_2 === false){
                clearInterval(sendInterval);
                socket.emit("stop_drive", state);
            }
        });

        let startTime = new Date().getTime();
        let i = 0;
        socket.on('liveStream', function(data) {
            if(new Date().getTime() - startTime >= 1000){
                startTime = new Date().getTime();
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
    },
    moveByKey(e){
        if (e.keyCode === 38) this.move(1);
        else if (e.keyCode === 37) this.move(2);
        else if (e.keyCode === 39) this.move(3);
        else if (e.keyCode === 40) this.move(4);
    },
    stopByKey(e){
        if (e.keyCode === 38) this.stopMove_1();
        else if (e.keyCode === 37) this.stopMove_2();
        else if (e.keyCode === 39) this.stopMove_2();
        else if (e.keyCode === 40) this.stopMove_1();
        if(interval_to_move_1_1 === false &&
            interval_to_move_1_2 === false &&
            interval_to_move_2_1 === false &&
            interval_to_move_2_2 === false){
            socket.emit("stop_drive", state);
        }
    },
    move: function move(e) {
        moveStatus = e;
        sendInterval = setInterval(function () {
            socket.emit("move", state);
        }, 1);
        if (e === 1 || e === 4) {
            if (e === 1 && interval_to_move_1_1 === false) {
                interval_to_move_1_1 = setInterval(function () {
                    now_ahead += 5;
                    if (now_ahead <= 70) state.drive = now_ahead;
                    else clearInterval(interval_to_move_1_1);
                }, 50);
            }
            else if (e === 4 && interval_to_move_1_2 === false) {
                interval_to_move_1_2 = setInterval(function () {
                    now_back -= 5;
                    if (now_back >= -70) state.drive = now_back;
                    else clearInterval(interval_to_move_1_2);
                }, 50);
            }
        } else if (e === 2 || e === 3) {
            if (e === 2 && interval_to_move_2_1 === false) {
                interval_to_move_2_1 = setInterval(function () {
                    now_left += 5;
                    if (now_left <= 70) state.rotate = now_left;
                    else clearInterval(interval_to_move_2_1);
                }, 25);
            } else if (e === 3 && interval_to_move_2_2 === false) {
                interval_to_move_2_2 = setInterval(function () {
                    now_right -= 5;
                    if (now_right >= -70) state.rotate = now_right;
                    else clearInterval(interval_to_move_2_2);
                }, 25);
            }
        }
    },
    stopMove_1: function stopMove_1() {
        if (now_ahead !== 0 || interval_to_move_1_1 !== false) {
            clearInterval(interval_to_move_1_1);
            interval_to_move_1_1 = false;
            now_ahead = 0;
            state.drive = 0;
            if (now_back===0) clearInterval(sendInterval);
        }
        if (now_back !== 0 || interval_to_move_1_2 !== false) {
            clearInterval(interval_to_move_1_2);
            interval_to_move_1_2 = false;
            now_back = 0;
            state.drive = 0;
            if (now_ahead===0) clearInterval(sendInterval);
        }
    },
    stopMove_2: function stopMove_2() {
        if (now_left !== 0 || interval_to_move_2_1 !== false) {
            clearInterval(interval_to_move_2_1);
            interval_to_move_2_1 = false;
            now_left = 0;
            state.rotate = 0;
            if (now_right===0) clearInterval(sendInterval);
        }
        if (now_right !== 0 || interval_to_move_2_2 !== false) {
            clearInterval(interval_to_move_2_2);
            interval_to_move_2_2 = false;
            now_right = 0;
            state.rotate = 0;
            if (now_left===0) clearInterval(sendInterval);
        }
    }
});


ReactDOM.render(<Home/>, document.getElementById('app') );
