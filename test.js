var cluster = require('cluster');

if(cluster.isMaster) {
    var numWorkers = require('os').cpus().length;

    console.log('Master cluster setting up ' + numWorkers + ' workers...');

    // Setup the file access parameters.
    const linesInFile = 1000000;
    const sliceSize = Math.floor(linesInFile/numWorkers);
    for(var i = 0; i < numWorkers; i++) {
        var worker = cluster.fork();
        
        var sliceStart = i * sliceSize;
        var sliceEnd = sliceStart + sliceSize >= linesInFile ? linesInFile - 1 : sliceStart + sliceSize - 1;

        worker.on('message', function(message) {
            console.log(message.from + ': ' + message.type + ' ' + message.data.number + ' = ' + message.data.result);
        });

        worker.send({
            filePath: 'Alexa-top-1m.csv',
            startLine: sliceStart,
            endLine: sliceEnd
        });
    }

    cluster.on('online', function(worker) {
        console.log('Worker ' + worker.process.pid + ' is online');
    });

    cluster.on('exit', function(worker, code, signal) {
        console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);        
    });
} else {
    process.on('message', async function(message) {        
        var nthline = require('nthline');
        var filePath = message.filePath;

        for (var i = message.startLine; i <= message.endLine; i++) {
            var line = await nthline(i, filePath);
            console.log('Worker ' + cluster.worker.process.pid + ' line: ' + line);
        }

        process.exit(0);
    });
}