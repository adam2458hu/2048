const express = require('express');
const app = express();
const path = require('path');

app.use(express.static(__dirname+'/dist/',{dotfiles: 'allow'}));

app.get('*', function (req, res){
    res.sendFile(path.join(__dirname+'/dist/index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port,()=>{
	console.log(`Az alkalmazás fut a ${port} porton`);
});