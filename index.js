const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5001;

const corsOptions = {
  origin: [
    "http://localhost:5001",
    "http://localhost:5173",
    "http://localhost:5174",
  ],
};
// MIDDLE-WARE //
app.use(cors(corsOptions));
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yy4jwyq.mongodb.net/?appName=Cluster0`;

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
    // Send a ping to confirm a successful connection

    const postStoryCollection = client
      .db("interactive-storytelling-platform")
      .collection("postStory");
    const pathCollection = client
      .db("interactive-storytelling-platform")
      .collection("path");

    // STORY POSTED //
    app.post("/add-story", async (req, res) => {
      try {
        const story = req.body;
        const result = await postStoryCollection.insertOne(story);
        res.send(result);
      } catch (error) {
        console.error("Error Posting data:", error);
        res.status(500).send({ message: "Failed to Post data" });
      }
    });
    // ADD PATH //
    app.post("/add-path", async (req, res) => {
      try {
        const path = req.body;
        const result = await pathCollection.insertOne(path);
        res.send(result);
      } catch (error) {
        console.error("Error Posting data:", error);
        res.status(500).send({ message: "Failed to Post data" });
      }
    });
    // GET PATH //
    app.get("/get-path", async (req, res) => {
      try {
        const result = await pathCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send({ message: "Failed to fetch data" });
      }
    });
    // GET STORY //
    app.get("/all-story", async (req, res) => {
      try {
        const result = await postStoryCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send({ message: "Failed to fetch data" });
      }
    });
    // GET SINGLE STORY //
    app.get("/all-story/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await postStoryCollection.findOne(query);
        res.send(result);
      });
    //   UPDATE STORY //
    app.put("/all-story/:id", async (req, res) => {
        const id = req.params.id;
        const updatedId = { _id: new ObjectId(id) };
        const options = { upsert: true };
        const updateBlog = req.body;
        const updateMyBlog = {
          $set: {
            title: updateBlog.title,
            storyDescription: updateBlog.storyDescription,
          },
        };
        const result = await postStoryCollection.updateOne(
          updatedId,
          updateMyBlog,
          options
        );
        res.send(result);
      });
    // GET STORY DETAILS //
    app.get("/story-details/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await postStoryCollection.findOne(query);
        res.send(result);
      } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send({ message: "Failed to fetch data" });
      }
    });
    app.get("/my-story/:email", async (req, res) => {
      const myEmail = req.params.email.trim();
      try {
        const query = { email: myEmail };
        const result = await postStoryCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send({ message: "Failed to fetch data" });
      }
    });

    await client.db("admin").command({ ping: 1 });
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
  res.send("Job Task is Running!!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
