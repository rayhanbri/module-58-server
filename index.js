const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 3000
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

    // eikhane collection create korle ar manually giye banai diye aste hoi na 
    const applicationsCollection = client.db('module-58').collection('applications')

    app.get('/jobs', async (req, res) => {
      const email = req.query.email;
      const query = {};
      if(email){
        query.hr_email= email;
      }
      const result = await jobsCollection.find(query).toArray();
      res.send(result)
    })


  // eitar jobs/id er niche declare korle kaj korbe na , eita upore declare korte hobe 
    // aggregate data 
    app.get('/jobs/applications',async(req,res)=>{
      const email = req.query.email;
      const query = {hr_email :  email}
      const jobs = await jobsCollection.find(query).toArray();

      for(const job of jobs){
        const applicationQuery = {jobId: job._id.toString()}
        const applicationCount = await applicationsCollection.countDocuments(applicationQuery)
        job.applicationCount = applicationCount;

      }
      res.send(jobs)

    })




    // get single data with id 
    app.get('/jobs/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const result = await jobsCollection.findOne(filter)
      res.send(result)
    })

    // post in job 
    app.post('/jobs', async (req, res) => {
      const newJob = req.body;
      // console.log(newJob)
      const result = await jobsCollection.insertOne(newJob);
      res.send(result)
    })



    // job application 

    // get data from job application 
    app.get('/applications', async (req, res) => {
      const email = req.query.email;
      const query = {
        applicant: email
      }
      const result = await applicationsCollection.find(query).toArray()

      // a bad way to aggregate data 
      for (const application of result) {
        jobId = application.jobId;
        const jobQuery = { _id: new ObjectId(jobId) }
        const job = await jobsCollection.findOne(jobQuery)
        application.company = job.company
        application.title = job.title
        application.company_logo = job.company_logo
      }
      res.send(result)
      // ei ta kaj korche ki na chech korar upai 
      // url/applications?email=rayahn@gmail.com 
    })


    


    // post data in job application 
    app.post('/applications', async (req, res) => {
      const application = req.body;
      console.log(application)
      const result = await applicationsCollection.insertOne(application)
      res.send(result)
    })


    //  status change 
    app.patch('/applications/:id',async(req,res) => {
      const id = req.params.id;
      const filter  = {_id:new ObjectId(id)};
      const data = req.body.status;
      const updatedDoc = {
        $set:{status : data}
      }
      const result = await applicationsCollection.updateOne(filter,updatedDoc)
      res.send(result)

    })

    // data for showing on view application 
    app.get('/applications/job/:id',async(req,res) => {
      const id = req.params.id;
      const query = {jobId:id}
      const result = await applicationsCollection.find(query).toArray();
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
