const key=require('./keys')
const redis = require('redis')
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

const app=express()
app.use(cors())
app.use(bodyParser.json())



const {pool}=require('pg')
const pgClient = new pool({
    user:key.pgUser,
    host:key.pgHost,
    password:key.pgPassword,
    database:key.pgDatabase,
    port:key.pgPort


})

pgClient.on('error',()=>console.log('Lost PG connection'))

pgClient.
query('CREATE TABLE IF NOT EXISTS values(number INT').
catch((error)=>console.log(error))


const redisClient=redis.createClient({
    host:key.redisHost,
    port:key.redisPort,
    retry_strategy:()=>1000
})

const redisPublisher=redisClient.duplicate()


app.get('/', (req, res)=>{
    res.send('Hi')
});
app.get('/values/all',async(req, res)=>{
    const values=await pgClient.query('SELECT * FROM values')
    res.send(values.rows)
})

app.get('/values/current',async(req, res)=>{
    redisClient.hgetall('values',(err,value)=>{
        res.send(value)
    })

})

app.post('/values',async(req, res)=>{
    const index=req.body.index
    if(parseInt(index)>40){
        return res.status(442).send('Index is too high')

    }
    redisClient.hset('values',index,'Nothing yet!')
    redisPublisher.publish('insert',index)
    pgClient.query('INSERT INTO values(number) VALUES($1)',[index])

    res.send({working:true})
})

app.listen(5000,(err)=>{
    console.log('listening ')
})
