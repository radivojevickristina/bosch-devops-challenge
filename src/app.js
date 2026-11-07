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

app.route('/visits').get(
    async (req, res) => {
        try {
            const redisClient = req.app.locals.redisClient
            const count = await redisClient.incr('visits')
            res.json({visits: count})

        } catch (error) {
            console.error('Redis operation failed:', error.message)

            return res.status(503).json({
                error: 'Redis unavailable'
            })
        }
        
    }
)

app.route('/health').get(
    async (req, res) => {
        try {
            const redisClient = req.app.locals.redisClient
            const response=await redisClient.ping()
            if(response==="PONG"){
                return res.status(200).json({
                    status:"ok"
                })
            }

        } catch{

            return res.status(503).json({
                status:"error"
            })
        }
        
    }
)


module.exports=app