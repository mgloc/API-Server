//Environment variables
require('dotenv').config();
const port = process.env["PORT"] || 3001;

//Initialise express
const cors = require('cors');
const { randomUUID } = require('crypto');
const express = require('express');
const app = express();

//Other imports
const fs = require("fs");
path_data_messages = "./data/messages.json";

app.use(cors())
app.use(express.json())

//Functions
const readFile = function(path){
    let rawdata = fs.readFileSync(path);
    let json = JSON.parse(rawdata);
    return json
}

const writeFile = function(path,json){
    fs.writeFileSync(path, JSON.stringify(json,null,2));
    return true;
}

const appendFile = function(path,js_item){
    var json = readFile(path)
    json.push(js_item)
    
    writeFile(path, json)
    return true;
}

const getHoursMinutes = function(date){
    const mins = ('0'+date.getMinutes()).slice(-2);
    const hours = ('0'+date.getHours()).slice(-2);
    return hours + ':' + mins
}

const deleteHappenedBefore = function(path,secondsBefore){
    const time = Date.now();
    const json = readFile(path).filter(m=>{
        const mTime = parseInt(m.time)
        if (mTime+secondsBefore<time){
            return false;
        }
        return true;
    })
    writeFile(path,json)
    console.log("Removing old messages")
}

const autoRemoveOld = async function(path,secondsBefore,timeout){
    setInterval(
        ()=>{deleteHappenedBefore(path,secondsBefore)},
        timeout
        )
}

//Routes
app.get('/', (req, res) => {
    res.send('API chillpaper.fr v1.0');
});

//Messages routes
app.get('/messages',(req,res)=>{
    let messages = readFile(path_data_messages).map(m => {
        return {
            _id:m._id,
            username:m.username,
            time:getHoursMinutes(new Date(parseInt(m.time))),
            text:m.text,
            color:m.color,
        }

    })

    res.send(messages)
});

app.post('/messages',(req,res)=>{
    const username = String(req.query.username);
    const color = String(req.query.color);
    const text = String(req.query.text);

    const time = String(Date.now());
    const _id = randomUUID();

    const message = {_id,username,color,text,time}

    appendFile(path_data_messages,message)

    res.send(message)
});

//Auto-removing old messages from the database
const dayInMiliseconds = 86400000;
const minuteInMiliseconds = 60000;
autoRemoveOld(path_data_messages,dayInMiliseconds,dayInMiliseconds-minuteInMiliseconds)

app.listen(port, () => console.log(`API listening on port ${port}!`))