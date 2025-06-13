const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 3000
require('dotenv').config()
// 4th use cookie for cors midlware 
// middleware 
app.use(cors())
app.use(express.json())

const decoded =Buffer.from(process.env.Fb_key,'base64').toString('utf-8')

// install firebase admin in cmd 
const admin = require("firebase-admin");
// change the path here 
const serviceAccount = JSON.parse(decoded);
// eibar deploy kore dhibho vercel --prod
// er por vercel env the add khore redeploy kore dhibho 


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
// now generate a private key from firebase
// then copy in this project file 
// must set this file in git ignore  
//change the path 
// now wirte a try catch block verify 




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


// eita obbosi run er upore banabo 
const verifyFirebaseToken = async(req,res,next) => {
  // er por eita midleware hibese api the set  kore asbho 
  // console.log('token in middleware',req.headers)
  const authHeader = req.headers?.authorization;
  // console.log(authHeader)
  if(!authHeader || !authHeader.startsWith('Bearer ')){
     // bearer er por must space dite hobe 
     return res.status(401).send({message : 'unauthorized access'})
    //  must return korte hobe 
  }

  const token = authHeader.split(' ')[1];
  // console.log('token in ware ',token)
  // go to firebase admin copy code/// service account
  try{
    const decoded = await admin.auth().verifyIdToken(token);
    console.log('decoded token',decoded)
    req.decoded = decoded;
    // lets go to api 
    next();
  }
  catch(error){
    return res.status(401).send({message : 'unauthorized access'})
  }
  // next();
  // next ekhane rakbho na 
}

// vefiry email ta middleware hisebe set kore daw 
// code delete kore daw 
// go to client work with api 
const verifyTokenEmail = (req,res,next) =>{
  if(req.query.email !== req.decoded.email){
   return res.status(403).send({message : 'forbidden access'})
  }
  next();
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();


    const jobsCollection = client.db('module-58').collection('jobs')



    // eikhane collection create korle ar manually giye banai diye aste hoi na 
    const applicationsCollection = client.db('module-58').collection('applications')
  
    //  jwt related api 

    
    

    // get  job data 
    app.get('/jobs', async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query.hr_email = email;
      }
      const result = await jobsCollection.find(query).toArray()
      res.send(result)
    })

    app.get('/jobs/applications',verifyFirebaseToken,verifyTokenEmail, async (req, res) => {
      const email = req.query.email;
      if(email !== req.decoded.email ){
        return res.status(403).send({message : 'forbidden access'})
      }
      const query = { hr_email: email }
      const jobs = await jobsCollection.find(query).toArray();

      for (const job of jobs) {
        const applicationQuery = { jobId: job._id.toString() }
        const applicationCount = await applicationsCollection.countDocuments(applicationQuery)
        job.applicationCount = applicationCount + 1;
      }
      res.send(jobs)
    })

    // get data with job id 
    app.get('/jobs/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const result = await jobsCollection.findOne(filter);
      res.send(result)
    })


    // data post for applicaton 

    app.post('/applications', async (req, res) => {
      const data = req.body;

      const result = await applicationsCollection.insertOne(data)
      res.send(result)
    })

    // get data with email 
    app.get('/applications',verifyFirebaseToken,verifyTokenEmail,async (req, res) => {
      const email = req.query.email;
      // console.log(req.headers)
      // erpor ekta verifyfirebase er token banabo 

      
      // ekhon er locacl hot er data pabo na 
      // eibar client side giye bininno api er khetre use korbo 
      const query = {
        applicant: email
      }
      // console.log('cookies from server',req.cookies)
      const result = await applicationsCollection.find(query).toArray()

      // data  aggregate here 
      for (const application of result) {
        const jobId = application.jobId;
        const jobQuery = { _id: new ObjectId(jobId) }
        const job = await jobsCollection.findOne(jobQuery)
        application.title = job.title
        application.company_logo = job.company_logo
        application.company = job.company;
      }
      res.send(result)
    })

    // get one data  
    app.patch('/applications/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const data = req.body.status;
      const updateDoc = {
        $set: { status: data }
      }
      const result = await applicationsCollection.updateOne(filter, updateDoc)
      res.send(result)

    })







    // get data  for single application 
    app.get('/applications/job/:id', async (req, res) => {
      const id = req.params.id;
      const query = { jobId: id }
      const result = await applicationsCollection.find(query).toArray();
      res.send(result)

    })






    // data post for job 
    app.post('/jobs', async (req, res) => {
      const data = req.body;
      const result = await jobsCollection.insertOne(data);
      res.send(result)
    })

    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
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
