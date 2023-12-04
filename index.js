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
// Middleware to check if user is an admin
    const isAdmin = (req, res, next) => {
      if (req.user.role === "admin") {
        next(); 
      } else {
        res.status(403).json({ message: "Unauthorized" }); 
      }
    };

    // Route for updating user to admin
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

    // assets related api
    // app.post("/assets", async (req, res) => {
    //   const assetItems = req.body;
    //   const result = await assetCollection.insertOne(assetItems);
    //   res.send(result);
    // });

    app.get("/assetItems", async (req, res) => {
      const assets = await assetItemCollection.find({}).toArray();
      res.json(assets);
    });

    // employee related api
    app.post("/users", async (req, res) => {
      try {
        const userData = req.body;

        // Create the user in the database
        const result = await userCollection.insertOne(userData);
        if (result.insertedId) {
          res.status(201).json({ message: "User created successfully" });
        } else {
          res.status(500).json({ message: "Failed to create user" });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // employee profile

    app.get("/users", async (req, res) => {
      try {
        const userData = await userCollection.findOne({
          email: req.user.email,
        });

        if (userData) {
          res.status(200).json(userData);
        } else {
          res.status(404).json({ message: "User not found" });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
      }
    });
    // Update user data
    app.put("/users/:id", async (req, res) => {
      try {
        const { name, photoURL, dateOfBirth } = req.body;
        // Update user data in the database
        const updatedUserData = await userCollection.findOneAndUpdate(
          { email: req.user.email },
          { name, photoURL, dateOfBirth },
          { new: true }
        );

        if (updatedUserData) {
          res
            .status(200)
            .json({ message: "User information updated successfully" });
        } else {
          res.status(404).json({ message: "User not found" });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
      }
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
      console.log(query);
    const result = await assetItemCollection.find(query).toArray()
       
          res.json(result);
        
    });

    // request modal related api
    
    app.get('/users', async (req, res) => {
      const user = await userCollection.findOne({ email: req.query.email });
      res.json(user);
    });
    
    // Route to handle storing of the request data
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
      try {
        const assetItems = await assetItemCollection.find({}).toArray();
        res.json(assetItems);
      } catch (error) {
        console.error('Error fetching asset items', error);
        res.status(500).json({ message: 'Error fetching asset items' });
      }
    });
    
    app.post('/requests', async (req, res) => {
        const requestData = req.body;
        const requestCollection = client.db("assetManagement").collection("requests");
        const result = await requestCollection.insertOne(requestData);
       res.send(result)
    });
    





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
