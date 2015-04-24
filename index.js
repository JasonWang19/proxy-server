let http=require('http')
let request = require('request')
let argv = require('yargs')
	.default('host', '127.0.0.1')
	.argv
let fs = require('fs')
let port = argv.port || argv.host === '127.0.0.1' ? 8000 : 80
let scheme = 'http://'
let destinationUrl = scheme + argv.host + ':' + port
let logStream = argv.logfile ? fs.createWriteStream(argv.logfile) : process.stdout
let through = require('through')

http.createServer((req,res) => {
	logStream.write('\nEcho request headers: \n' + JSON.stringify(req.headers)+'\n')
	for(let header in req.headers) {
		res.setHeader(header,req.headers[header])
	}
	through(req, logStream, {autoDestroy:false})
	//logStream.write(req)
	//req.pipe(logStream)
	//process.stdout.write(req)
	req.pipe(res)
}).listen(8000)

//console.log('Listening at http://127.0.0.1:8000')
logStream.write('\nListening at http://127.0.0.1:8000')

http.createServer((req,res) => {
	let url = destinationUrl
	//console.log(url)
	if(req.headers['x-destination-url']) {
		url = req.headers['x-destination-url']
	}
	let options = {
		url : url,
		headers : req.headers
	}

	logStream.write('\nProxy request headers: \n' + JSON.stringify(req.headers) + '\n')
	through('2 ' + req, logStream, {autoDestroy:false})
	//req.pipe(logStream)
	//req.pipe(process.stdout)
	//logStream.write(req)

	let destinationResponse=req.pipe(request(options))
	logStream.write(JSON.stringify(destinationResponse.headers))

	destinationResponse.pipe(res)
	through(req, logStream, {autoDestroy:false})

}).listen(8001)

//console.log(destinationUrl)