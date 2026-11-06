const express=require('express')
const os=require('node:os')
const app=express()

app.use(
    (req, res, next)=>{
        res.on('finish', ()=>{
                console.log("Method: "+ req.method)
                console.log("URL: "+ req.originalUrl)
                console.log("Status: "+ res.statusCode)
                console.log("---------------------------")
        })

        next()

})

app.route('/').get(
    (req, res) => {
        res.json({message:"Hello DevOps", host: os.hostname()})
    }
)


module.exports=app