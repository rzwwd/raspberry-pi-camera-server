const   express         = require('express'),
        app             = express(),
        io              = require('socket.io')(app.listen(2281)),
        http            = require('http'),
        fs              = require("fs"),
        net             = require('net'),
        TCP             = process.binding('tcp_wrap').TCP,
        socket          = new TCP(),
        carDrive        = false;
let     sockets         = {},
        moveState       = {
                            direction: null,
                            value: 0
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
        moveState = e;
    })
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
                            let val = frameName+","+moveState.direction+","+parseFloat(moveState.value).toFixed(2);
                            fs.appendFile(folderName+'/move_data.txt', '\n'+val, function (err) {
                                moveState = {
                                    direction: null,
                                    value: 0
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
