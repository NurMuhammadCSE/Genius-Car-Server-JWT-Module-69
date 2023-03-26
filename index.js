const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
// > require('crypto').randomBytes(64).toString('hex')
//'4a407a064395821c834c200d786dff854e2b3feb192370879ce0b9a71361e18c97655a6e26584fc1a75f741e57beabb78092e23291d14987057996dc7d4793fa'

const { query } = require("express");
require("dotenv").config();
ObjectID = require("mongodb").ObjectID;

const app = express();
const port = process.env.PORT || 5000;

// console.log(process.env.DB_USER)
// console.log(process.env.DB_PASSWORD)

app.get("/", (req, res) => {
  res.send("Server is Running");
});

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.cai2g.mongodb.net/?retryWrites=true&w=majority`;

// console.log(uri)
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// function verifyToken(req, res, next) {
//   const authHeader = req.headers.authorization;
//   if(!authHeader){
//     return res.status(401).send({ message: "Unauthorized Access" });
//   }
//   // const token = authHeader.split(' ')[1];
//   // jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
//   //   if (err) {
//   //     res.status(401).send({ message: "Unauthorized Access" });
//   //   }
//   //   req.decoded = decoded;
//   //   next();
//   // });

// }

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    const serviceCollection = client.db("geniusCar").collection("services");

    const orderCollection = client.db("geniusCar").collection("orders");

    // console.log("Connected");

    app.post("/jwt", (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      res.send({ token });
    });

    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    app.get("/service/:id", async (req, res) => {
      const id = req.params.id;
      //   console.log(id);
      const query = { _id: new ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });

    // Orders API
    // app.get("/orders", verifyToken, async (req, res) => {
    //   // console.log(req.query.email);
    //   // console.log(req.headers.authorization)
    //   const decoded = req.decoded;
    //   console.log('Inside ',decoded)
    //   if(decoded.email !== req.query.email){
    //     res.status(403).send({message:'unauthorized access'})
    //   }
    //   let query = {};
    //   if (req.query.email) {
    //     query = {
    //       email: req.query.email,
    //     };
    //   }
    //   const cursor = orderCollection.find(query);
    //   const orders = await cursor.toArray();
    //   res.send(orders);
    // });

    app.post("/orders", async (req, res) => {
      const order = req.body;
      const result = orderCollection.insertOne(order);
      // console.log(result)
      res.send(result);
    });

    app.get("/orders", verifyJWT, async (req, res) => {
      const decoded = req.decoded;

      if (decoded.email !== req.query.email) {
        res.status(403).send({ message: "unauthorized access" });
      }

      // const decoded = req.decoded;
      // console.log('Inside Orders API', decoded)
      // console.log(req.headers.authorization)
      let query = {};

      // console.log(req.query);
      if (req.query.email) {
        query = {
          email: req.query.email,
        };
      }

      const cursor = orderCollection.find(query);
      const orders = await cursor.toArray();
      res.send(orders);
    });

    app.patch("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const status = req.body.status;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: status,
        },
      };
      const result = await orderCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    app.delete("/orders/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = orderCollection.deleteOne(query);
      res.send(result);
      if (result.deletedCount === 1) {
        console.log("Successfully deleted one document.");
      } else {
        console.log("No documents matched the query. Deleted 0 documents.");
      }
    });
  } finally {
  }
}

run().catch((err) => console.log(err));

app.listen(port, () => {
  console.log(`Server is Running ${port}`);
});
