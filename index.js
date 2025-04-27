const express = require('express'); 

const request = require('request'); 
const path = require ('path');
const app = express(); 

 

app.use((req, res, next) => { 

  // CORS headers add karna 

  res.header('Access-Control-Allow-Origin', '*'); 

  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept'); 

  next(); 

}); 


app.use (express.static(path.join(__dirname,'public')));




 

app.get('/proxy', (req, res) => { 

  const url = req.query.url; 

  if (!url) { 

    return res.status(400).send('Missing url parameter'); 

  } 
if (url.endsWith('.m3u8)){
                 res.setHeader('Content-Type',
                               'application/vnd.apple.mpegurl');
} else if (url.endsWith('.ts')) {
 res.setHeader('Contend-Type' , 'video/MP2T');
}
   

  // Original URL se stream fetch karke response me bhejna 

  request 

    .get(url) 

    .on('error', err => { 

      res.status(500).send('Error fetching the URL'); 

    }) 

    .pipe(res); 

}); 
const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>{
  console.log(`running ${PORT}`);
  
});

 
