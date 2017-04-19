const   express         = require('express'),
        app             = express(),
        io              = require('socket.io')(app.listen(2281)),
        http            = require('http'),
        fs              = require("fs"),
        net             = require('net'),
        request         = require('request'),
        TCP             = process.binding('tcp_wrap').TCP,
        socket          = new TCP(),
        carDrive        = false,
        rpi_ip_address  = "192.168.1.220";
let     sockets         = {},
        moveState       = {
                            rotate: 0,
                            drive: 0
                        },
        cameraStatus    = false;

socket.bind('0.0.0.0', 2282);
app.use('/include', express.static('include'));
app.use('/socket.io/socket.io.js', express.static(__dirname+'/socket.io/socket.io.js'));
app.all("/", function (req, res, err) {
    res.sendFile(__dirname+"/index.html")
});
if (carDrive && !fs.existsSync("./collected_data")) fs.mkdirSync("./collected_data");

console.error("----------------------------------");console.error("Web server has started.");
console.error("----------------------------------");


io.on('connection', function (socket) {
    sockets[socket.id] = socket;

    socket.on('disconnect', function() {
        delete sockets[socket.id];
    });

    socket.on("startStream", function (e) {
        cameraStatus = true;
    });
    socket.on("stopStream", function (e) {
        cameraStatus = false;
    });

    socket.on("move", function (e) {
        if(moveState.rotate !== e.rotate){
            let v = parseInt(90000+((30000*e.rotate)/70));
            request.post(
                'http://'+rpi_ip_address+':2283/move_rotate',
                { json: { value: v } }
            ).on('error', function(err) {
                console.log(err);
            });
            moveState.rotate = e.rotate;
        }

        if(moveState.drive !== e.drive){
            let v = 0;
            if (e.drive < 0){
                v = parseInt(90000+((8000*e.drive)/70));
            }
            else{
                v = parseInt(90000+((7000*e.drive)/70));
            }

            request.post(
                'http://'+rpi_ip_address+':2283/move_drive',
                { json: { value: v } }
            ).on('error', function(err) {
                console.log(err);
            });
            moveState.drive = e.drive;
        }
    });

    socket.on("stop_drive", function (e) {
        request.post(
            'http://'+rpi_ip_address+':2283/stop',
            { json: { value: 0 } }
        ).on('error', function(err) {
            console.log(err);
        });
    });

});


const server = net.createServer((conn) => {
    function concatBuffers(a, b) {
        function concatTypedArrays(a, b) { // a, b TypedArray of same type
            let c = new (a.constructor)(a.length + b.length);
            c.set(a, 0);
            c.set(b, a.length);
            return c;
        }

        return concatTypedArrays(
            new Uint8Array(a.buffer || a),
            new Uint8Array(b.buffer || b)
        ).buffer;
    }

    let stream_bytes = [];

    conn.on('data', function (data) {
        let ddd = new Date();
        let folderName = "./collected_data/"+ddd.getFullYear()+"_"+ddd.getMonth()+"_"+ddd.getDate() +
            "-"+ddd.getHours()+"_"+ddd.getMinutes();

        stream_bytes = concatBuffers(stream_bytes, data);
        let stream_bytes_buffer = new Buffer(stream_bytes, 'base64');

        let first = stream_bytes_buffer.indexOf("ffd8", "hex");
        let last = stream_bytes_buffer.indexOf("ffd9", "hex");

        if (first !== -1 && last !== -1){
            let jpg = stream_bytes_buffer.slice(first, last+2);
            stream_bytes = stream_bytes.slice(last+2);
            let frame = new Buffer(jpg, 'base64').toString('base64');
            if(cameraStatus) {
                if(carDrive){
                    if (!fs.existsSync(folderName)) fs.mkdirSync(folderName);
                    let frameName = folderName+"/frame_"+ddd.getHours()+"_"+ddd.getMinutes()+
                        "_"+ddd.getMilliseconds()+".jpg";
                    fs.writeFile(frameName,
                        frame, 'base64', function(err) {
                            if (err) console.log(err);
                            let val = frameName+","+parseFloat(moveState.rotate).toFixed(2) + "," +
                                parseFloat(moveState.drive).toFixed(2);
                            fs.appendFile(folderName+'/move_data.txt', '\n'+val, function (err) {
                                moveState = {
                                    rotate: 0,
                                    drive: 0
                                };
                                if (err) throw err;
                            });
                        });
                }
                io.sockets.emit("liveStream", frame);
            }
        }
    });
    conn.end('bye\n');
}).listen(socket);
