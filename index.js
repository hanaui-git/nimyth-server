(async()=>{
    "use strict";

    // Dependencies
    const client = await require("./modules/mongodb")
    const simpleAES256 =  require("simple-aes-256")
    const jsc = require("js-string-compression")
    const bodyParser = require("body-parser")
    const express = require("express")
    const hqc = require("hqc")
    
    // Variables
    const options = require("./options.json")
    const web = express()
    const port = process.env.PORT || 8080
    const hm = new jsc.Hauffman()

    const keyPair = await hqc.keyPair()

    const database = client.db("core")
    const passwords = database.collection("nimyth.passwords")
    
    // Functions
    function getSecret(cyphertext){
        return new Promise(async(resolve)=>{
            resolve(await hqc.decrypt(Uint8Array.from(cyphertext.split(",").map(x=>parseInt(x,10))), keyPair.privateKey))
        })
    }
    
    /// Configurations
    // Express
    web.use(bodyParser.json({ limit: "50mb" }))
    
    // Main
    web.use((err, req, res, next)=>{
        if(err.message === "Bad request") return res.json({
            status: "failed",
            message: "Bad request."
        })

        next()
    })

    web.get("/pk", (req, res)=>{
        res.json({
            data: keyPair.publicKey.toString(),
        })
    })
    
    web.post("/s", async(req, res)=>{
        try{
            const clientSecret = await getSecret(req.body.cyphertext)
    
            req.body = simpleAES256.decrypt(clientSecret, Buffer.from(hm.decompress(req.body.data), "hex")).toString()
    
            await passwords.remove({ i: 0 })
            await passwords.insertOne({ i: 0, data: hm.compress(req.body) })
    
            res.json({
                status: "success",
                data: true
            })
        }catch{
            res.json({
                status: "failed",
                data: false
            })
        }
    })

    web.post("/gs", async(req, res)=>{
        try{
            const clientSecret = await getSecret(req.body.cyphertext)
    
            req.body = simpleAES256.decrypt(clientSecret, Buffer.from(hm.decompress(req.body.data), "hex")).toString()
    
            if(req.body.adminKey !== options.adminKey) return res.json({
                status: "failed",
                data: false
            })

            const decryptedPasswords = await passwords.findOne({ i: 0 })

            if(!decryptedPasswords) return res.json({
                status: "failed",
                data: "a"
            })

            res.json({
                status: "success",
                data: hm.decompress(decryptedPasswords.data)
            })
        }catch(err){
            console.log(err)
            res.json({
                status: "failed",
                data: false
            })
        }
    })
    
    web.use("*", (req, res)=>res.redirect("https://duckduckgo.com/"))
    
    web.listen(port, ()=>console.log(`Server is running. Port: ${port}`))
})()