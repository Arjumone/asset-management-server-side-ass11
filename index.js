const  express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1mhzzn6.mongodb.net/?retryWrites=true&w=majority`;

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
    // await client.connect();
    const emplyeecollection = client.db('assetManagement').collection('employee');
    const assetcollection = client.db('assetManagement').collection('asset');
    const reqassetcollection = client.db('assetManagement').collection('assetreq');
    const customreqassetcollection = client.db('assetManagement').collection('customreqassetreq');
    const adminreqcollection = client.db('assetManagement').collection('adminreq');
// admin req asset

app.post('/adminreq',async(req,res)=>{
  const user = req.body;
  console.log(user)
  const result = await adminreqcollection.insertOne(user)
  res.send(result)
})

app.get('/adminreq',async(req,res)=>{
  const result = await adminreqcollection.find().toArray()
  res.send(result)
})

// end ..

// asset api 
app.get('/asset',async (req,res)=>{
  const result = await assetcollection.find().toArray();
  res.send(result)
})


// end

// employye api

app.get('/employee',async(req,res)=>{
  const result = await emplyeecollection.find().toArray()
  res.send(result)
})

app.get('/employee/:id', async(req,res)=>{
  const id = req.params.id;
  const query = {_id : new ObjectId(id)}
  const result = await emplyeecollection.findOne(query)
  res.send(result)
})

app.delete('/employee/:id',async(req,res)=>{
  const id = req.params.id;
  const filter = {_id : new ObjectId(id)}
  const result = await emplyeecollection.deleteOne(filter)
  res.send(result)
})


    app.post('/employee',async(req,res)=>{
      const user = req.body;
      const result = await emplyeecollection.insertOne(user)
      res.send(result)
    })

    app.patch('/employee/:id', async(req,res)=>{
      const item = req.body;
      const id = req.params.id;
      const filter = { _id : new ObjectId(id) }
      const updateddoc = {
        $set : {
          fullname : item.name,
          dateofbirth : item.birth
        }
      }
      const result = await emplyeecollection.updateOne(filter,updateddoc)
      res.send(result)
    })

    // end

    // req asset api

    app.post('/assetreq',async(req,res)=>{
      const item = req.body;
      console.log(item)
      const result = await reqassetcollection.insertOne(item)
      res.send(result)
    })

   app.get('/assetreq', async(req,res)=>{
 const result = await reqassetcollection.find().toArray();
 res.send(result)
})

app.patch('/assetreq/:id', async(req,res)=>{
  const item = req.body;
  const id = req.params.id;
  const filter = { _id : new ObjectId(id) }
  const updateddoc = {
    $set : {
      RequestStatus : item.reqStatus,
      Approvedate : item.appdate
    }
  }
  const result = await reqassetcollection.updateOne(filter,updateddoc)
  res.send(result)
})

app.delete('/assetreq/:id', async(req,res)=>{
  const id = req.params.id;
  const filter = { _id : new ObjectId(id)}
  const result = await reqassetcollection.deleteOne(filter)
  res.send(result)
})



//  end

// custom req asset api

app.post('/customreqassetreq',async(req,res)=>{
  const item = req.body;
  const result = await customreqassetcollection.insertOne(item)
  res.send(result)
})

app.get('/customreqassetreq',async(req,res)=>{
  const result = await customreqassetcollection.find().toArray()
  res.send(result)
})

app.get('/customreqassetreq/:id', async(req,res)=>{
  const id = req.params.id;
  const query = {_id : new ObjectId(id)}
  const result = await customreqassetcollection.findOne(query)
  res.send(result)
})

app.patch('/customreqassetreq/:id', async(req,res)=>{
  const item = req.body;
  const id = req.params.id;
  const filter = { _id : new ObjectId(id) }
  const updateddoc = {
    $set : {
      Price : item.price ,
      additionaleinfo : item.additioninfo,
      assetimg : item.image,
      assetname : item.name,
      assettype : item.type,
      requesteddate : item.reqdate,
      status : item.assetstatus,
      whyneedthis : item.whyneed
    }
  }
  const result = await customreqassetcollection.updateOne(filter,updateddoc)
  res.send(result)
})
// end



    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',async(req,res)=>{
   res.send('assignment 12')
})

app.listen(port, ()=>{
    console.log(`Coming from server ${port}`)
})