const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express')
const app = express()
const cors = require('cors')
const port =  process.env.PORT ||   3000
require('dotenv').config()

// middleware 
app.use(cors())
app.use(express.json())

// cluster - connect er moddo theke connect korar code tah iye asbho 

// mongodb the insert doucment e giye data gulo inseta korbo



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.eztfylz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const jobsCollection = client.db('module-58').collection('jobs')

    app.get('/jobs', async(req,res)=> {
        const result = await jobsCollection.find().toArray();
        res.send(result)
    })







    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.get('/', (req, res) => {
  res.send('Working')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
