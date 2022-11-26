"use strict";

// Dependencies
var xchacha20 = require("xchacha20-js").XChaCha20
const simpleAES256 = require("simple-aes-256")
const shuffleSeed = require("shuffle-seed")
const sovrinDID = require("sovrin-did")
const express = require("express")

// Variables
xchacha20 = new xchacha20()

const server = {
    masterKey: "", // Recommended characters is 82 but more is better.
    xChaKey: "",  // Maximum characters is 32
    nonce: "" // Maximum characters is 24
}

const web = express()
const port = process.env.PORT || 8080

const sovrin = sovrinDID.gen()
const signKey = sovrin.secret.signKey
const keyPair = sovrinDID.getKeyPairFromSignKey(signKey)
var nonce = sovrinDID.getNonce()

// Functions
function customEncrypt(string){
    return shuffleSeed.shuffle(string.split(""), server.masterKey).join("")
}

function customDecrypt(encryptedString){
    return shuffleSeed.unshuffle(encryptedString.split(""), server.masterKey).join("")
}

/// Configurations
// Express
web.use(express.json())

// Main
web.get("/pk", (req, res)=>{
    res.json({
        pk: keyPair.publicKey.toString(),
    })
})

web.post("/e", async(req, res)=>{
    try{
        req.body.pk = Uint8Array.from(req.body.pk.split(",").map(x=>parseInt(x,10)))
        req.body.a = Uint8Array.from(req.body.a.split(",").map(x=>parseInt(x,10)))
        req.body.s = Uint8Array.from(req.body.s.split(",").map(x=>parseInt(x,10)))
    
        const data = JSON.parse(sovrinDID.decryptMessage(req.body.s, req.body.a, sovrinDID.getSharedSecret(req.body.pk, keyPair.secretKey)).toString())
        var encryptedString = await xchacha20.encrypt(data.string, new Buffer.from(server.nonce), new Buffer.from(server.xChaKey), 1)
        encryptedString = new Buffer.from(encryptedString).toString("hex")
        encryptedString = new Buffer.from(simpleAES256.encrypt(data.password, encryptedString)).toString("hex")
        encryptedString = customEncrypt(encryptedString)

        res.json({
            pk: keyPair.publicKey.toString(),
            a: nonce.toString(),
            s: sovrinDID.encryptMessage(encryptedString, nonce, sovrinDID.getSharedSecret(req.body.pk, keyPair.secretKey)).toString()
        })
    }catch{
        res.send("Unknown error. | 91681HZWgZ")
    }
})

web.post("/d", async(req, res)=>{
    try{
        req.body.pk = Uint8Array.from(req.body.pk.split(",").map(x=>parseInt(x,10)))
        req.body.a = Uint8Array.from(req.body.a.split(",").map(x=>parseInt(x,10)))
        req.body.s = Uint8Array.from(req.body.s.split(",").map(x=>parseInt(x,10)))
    
        const data = JSON.parse(sovrinDID.decryptMessage(req.body.s, req.body.a, sovrinDID.getSharedSecret(req.body.pk, keyPair.secretKey)).toString())
        var decryptedString = customDecrypt(data.string)
        decryptedString = new Buffer.from(simpleAES256.decrypt(data.password, new Buffer.from(decryptedString, "hex"))).toString()
        decryptedString = await xchacha20.decrypt(new Buffer.from(decryptedString, "hex"), new Buffer.from(server.nonce), new Buffer.from(server.xChaKey), 1)
        decryptedString = decryptedString.toString()

        res.json({
            pk: keyPair.publicKey.toString(),
            a: nonce.toString(),
            s: sovrinDID.encryptMessage(decryptedString, nonce, sovrinDID.getSharedSecret(req.body.pk, keyPair.secretKey)).toString()
        }).on("finish", ()=>{
            nonce = sovrinDID.getNonce()
        })
    }catch{
        res.send("Unknown error. | 91681HZWgZ")
    }
})

web.use("*", (req, res)=>res.redirect("https://duckduckgo.com/"))

web.listen(port, ()=>console.log(`Server is running. Port: ${port}`))