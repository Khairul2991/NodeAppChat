var express = require('express')
var bodyParser = require('body-parser')
var app = express() //reference Variabel
var http = require('http').Server(app)
var io = require('socket.io')(http)
var mongoose = require('mongoose')

app.use(express.static(__dirname))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

mongoose.Promise = Promise

var dbUrl = 'mongodb+srv://auni3934:auni39344@mongo-db-starter.9bsrowk.mongodb.net/?retryWrites=true&w=majority&appName=Mongo-Db-Starter'

var BadwordSchema = new mongoose.Schema({
    word: String
});

var Badword = mongoose.model('Badword', BadwordSchema);

var badwords = [
    { word: 'mawar' },
    { word: 'tikus' },
    { word: 'anjing' },
    { word: 'babi' },
    { word: '2' },
    { word: '1' },
];

mongoose.connect(dbUrl).then(async () => {
    console.log('Connected to db')
    try {
        for (let i = 0; i < badwords.length; i++) {
            let existingBadword = await Badword.findOne(badwords[i]);
            if (!existingBadword) {
                await Badword.create(badwords[i]);
                console.log(`Badword "${badwords[i].word}" berhasil ditambahkan.`);
            } 
        }
    } catch (err) {
        console.error(err);
    }
}).catch((err) => { console.error(err) })

var Message = mongoose.model('Message', {
    nama: String,
    pesan: String
})

app.get('/pesan', (req, res) => {
    Message.find({}).then((pesan) => {
        res.send(pesan)
    }).catch((err) => {
        res.sendStatus(500)
        return console.error(err)
    })
})

async function postPesan(pesan) {
    var badwords = await Badword.find({});
    badwords.forEach(async function(badword) {
        var regex = new RegExp(badword.word, 'gi');
        pesan.pesan = pesan.pesan.replace(regex, '*'.repeat(badword.word.length));
        pesan.nama = pesan.nama.replace(regex, '*'.repeat(badword.word.length));
    });
    
    var message = new Message(pesan); 
    var savedMessage = await message.save();
    
    io.emit('pesan', pesan);
}

app.post('/pesan', async (req, res) => {
    try{
        await postPesan(req.body);
        res.sendStatus(200)
    }catch(err){
        res.sendStatus(500)
        return console.error(err)
    }
})

io.on('connection', function (socket) {
    console.log('a user connected')
})

var server = http.listen(3000, function () {
    console.log("port server adalah", server.address().port)
})