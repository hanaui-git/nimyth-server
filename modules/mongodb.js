"use strict";

require("dotenv").config()

// Dependencies
const { MongoClient } = require("mongodb")

// Variables
const uri = process.env.MONGODB_URL
const options = {
    useUnifiedTopology: true,
    useNewUrlParser: true,
}

let client;
let clientPromise;

// Main
if(!uri) throw new Error("Please set a MongoDB url.")

if(process.env["NODE_ENV"] === "development"){
    if(!global._mongoClientPromise){
        client = new MongoClient(uri, options)
        global._mongoClientPromise = client.connect()
    }

    clientPromise = global._mongoClientPromise
}else{
    client = new MongoClient(uri, options)
    clientPromise = client.connect()
}

module.exports = clientPromise