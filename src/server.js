const app=require('./app')
const {createClient}=require('redis')
const port=Number(process.env.APP_PORT)


app.listen(port, '0.0.0.0', () =>{
    console.log('Server is running on port ', port)
})

const redisClient=createClient({
    socket:{
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT)
    }
})
app.locals.redisClient=redisClient

async function connectToRedis() {
    await redisClient.connect()
    console.log('Redis connected successfully')
}

redisClient.on('error', (error)=>{
    console.error("Redis error: ", error.message)
})

connectToRedis()
