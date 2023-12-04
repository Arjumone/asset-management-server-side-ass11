const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");

require("dotenv").config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1mhzzn6.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const userCollection = client.db("assetManagement").collection("users");
    const assetItemCollection = client.db("assetManagement").collection("assetItems");
    const requestCollection = client.db("assetManagement").collection("requests");
    const itemRequestCollection = client.db("assetManagement").collection("itemRequest");
    const teamCollection = client.db("assetManagement").collection("team");

    // users related api
    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists", insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // admin related api
    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === "admin";
      }
      res.send({ admin });
    });


    const isAdmin = (req, res, next) => {
      if (req.user.role === "admin") {
        next(); 
      } else {
        res.status(403).json({ message: "Unauthorized" }); 
      }
    };

    app.post('/assetItems', async (req, res) => {
        const assetInfo = req.body;
        const result = await assetItemCollection.insertOne(assetInfo);
        res.send(result);
    });

    // request admin api
    app.get('/requests', async (req, res) => {
      let query = {};
        if (searchQuery) {
          query = {
            $or: [
              { requesterName: { $regex: searchQuery, $options: 'i' } },
              { requesterEmail: { $regex: searchQuery, $options: 'i' } }
            ]
          };
        }
        const requests = await requestCollection.find(query).toArray();
        res.json(requests);
    });

    // Route for update user to admin
    app.put("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const {
        fullName,
        companyName,
        companyLogo,
        dateOfBirth,
        select,
        userName,
        userEmail,
        userImage,
      } = req.body;

      const updatedDoc = {
        $set: {
          role: "admin",
          companyName: companyName,
          companyLogo: companyLogo,
          dateOfBirth: dateOfBirth,
          select: select,
          fullName: fullName,
          userName: userName,
          userEmail: userEmail,
          userImage: userImage,
        },
      };
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // Route for admin dashboard
    app.get("/adminDashboard/logo", isAdmin, (req, res) => {});


    app.get("/assetItems", async (req, res) => {
      const assets = await assetItemCollection.find({}).toArray();
      res.send(assets);
    });

    // employee related api
    app.post("/users", async (req, res) => {
      
        const userData = req.body;
        const result = await userCollection.insertOne(userData);
       res.send(result)
      
    });

    // employee profile
    app.put('/users/:email', async (req, res) => {
      const email = req.params.email;
        const result = await userCollection.updateOne({ email:email });
        res.send(result)
    });
    
    // request an asset page api
    app.get('/assetItems', async(req, res) => {
      let query = {};
     console.log(req.query.name);
      if (req.query.name) {
        query.asset_name = { $regex: new RegExp(req.query.name, 'i') };
      }
      if (req.query.availability) {
        query.availability = req.query.availability;
      }
      if (req.query.assetType) {
        query.asset_type = req.query.assetType;
      }
     const result = await assetItemCollection.find(query).toArray()
       
          res.send(result);
        
    });

    // request modal related api
    
    app.get('/users', async (req, res) => {
      const user = await userCollection.findOne({ email: req.query.email });
      res.send(user);
    });
    
    app.post('/requests', async (req, res) => {
      const requestData = req.body;
    
      const user = await userCollection.findOne({ email: requestData.userEmail });
      if (user) {
        requestData.requestDate = new Date();
        const result = await requestCollection.insertOne(requestData);
        res.send(result);
      } else {
        res.status(404).send('User not found');
      }
    });
    

    // make a custom api
    app.get('/assetItems', async (req, res) => {
        const assetItems = await assetItemCollection.find({}).toArray();
        res.send(assetItems);
      
    });
    
    app.post('/requests', async (req, res) => {
      const request = req.body;
      const result = await requestCollection.insertOne(request);
      res.send(result);
    });


    // my asset page api
    app.get('/assetItems', async (req, res) => {
      const searchName = req.query.search || '';
      const type = req.query.type || 'all';
      let query = {};
      if (searchName) {
          query.asset_name = { $regex: searchName, $options: 'i' };
      }
      if (type !== 'all') {
          query.asset_type = type;
      }
          const assetItems = await assetItemCollection.find(query).toArray();
          res.send(assetItems);
  });
  

  // my team api
  app.get('/users', async (req, res) => {
    const currentMonth = new Date().getMonth();
    const upcomingEvents = await userCollection.find({
        $expr: { $eq: [{ $month: '$dateOfBirth' }, currentMonth + 1] } 
    }).toArray();

    const today = new Date();
    upcomingEvents.forEach(event => {
        const eventDate = new Date(event.dateOfBirth.setFullYear(today.getFullYear()));
        if (eventDate < today) {
            eventDate.setFullYear(today.getFullYear() + 1);
        }
        const diffTime = Math.abs(eventDate - today);
        const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        event.remainingDays = remainingDays;
    });

    res.send(upcomingEvents);
});

// employee home





    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
