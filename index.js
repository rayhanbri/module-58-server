const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const app = express()
const cors = require('cors')
const jwt = require('jsonwebtoken');
const cookiePareser = require('cookie-parser')
const port = process.env.PORT || 3000
require('dotenv').config()

// 4th use cookie for cors midlware 





// middleware 
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}))
app.use(express.json())
app.use(cookiePareser())
var admin = require("firebase-admin");

var serviceAccount = require("./firebase-admin-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});



const logger = (req, res, next) => {
  console.log('i am logger');
  next();
}

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  console.log('cookie in middleware', token)
  if (!token) {
    return res.status(401).send({ message: 'unauthorized access' })
  }


  // ekhane amra token k verify korbo bhondhura 
  jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'unauthorized access' })
    }
    console.log(decoded)
    req.decoded = decoded;
    next();
    // ekhon abar app .get e giye if set kore asbho decode diye 
  })
  // next aghe ekhane chilo 
}


const verifyFirebaseToken = async(req,res,next) =>{
  const authHeader= req.headers?.authorization;
  const token = authHeader.split(' ')[1];

  if(!token){
    return res.status(401).send({message:'unauthorized access'})

  }

  // erpor firebse er account er project e giye projectsettinge jabo.
  // er por service accounts e jabo .firebase admin install.code ta niye asbho okha
  // theke .middle ware er niche oita boshai dhibo .generate new key the click korle ekta jinis dowanload hobe .er por download hoye gele file take copy kore ekhae niye asbho and ekta meaining full nam dhibho.code je khane copy korechi okhane middle ware er niche require er jaighai new file er nam ta dhibho.
//.erpor await kora userinfo set korbo 
 
  // eita application e set kore asle eita cmd the dhekha jabe 
  // er por ekhane abar asbho
  const userInfo = await admin.auth().verifyIdToken(token)
  // console.log( 'id token ula la ',  userInfo)
  req.tokenEmail = userInfo.email;
 // console.log('firebase token',token)
//  er por application e giye state ment bosabho 
  next();

}

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



    // jwt related api 
    app.post('/jwt', async (req, res) => {
      const userData = req.body;
      // console.log(userData)
      const token = jwt.sign(userData, process.env.JWT_ACCESS_SECRET, { expiresIn: '1d' })
      res.cookie('token', token, {
        httpOnly: true,
        secure: false
      })
      res.send({ success: true, token })
    })

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

    app.get('/jobs/applications', async (req, res) => {
      const email = req.query.email;
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
    app.get('/applications', logger, verifyToken,verifyFirebaseToken, async (req, res) => {
      const email = req.query.email;
        // firebase admin file k must git ignore korte hobe 
      if(req.tokenEmail !== email){
          return res.status(403).send({message:'forbidden access'})
      }

      if(email !== req.decoded.email){
        return res.status(403).send({message:'forbidden access'})
      }



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
