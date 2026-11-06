const app=require('./app')
const port=Number(process.env.APP_PORT)


app.listen(port, '0.0.0.0', () =>{
    console.log('Server is running on port ', port)
})