const express = require("express");
const app = express();
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();
const port = process.env.PORT || 5001;

const corsOptions = {
  origin: [
    "http://localhost:5001",
    "http://localhost:5173",
    "http://localhost:5174",
    "https://interactive-storytelling-platform-server.vercel.app",
    "https://interactive-storytelling-7893f.web.app"
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
    app.post("/add-path", async (req, res) => {
      const { title, initialContent, options, postedTime, email, viewCount } =
        req.body;
      const parentId = options.length > 0 ? uuidv4() : "";
      const optionTitles = options.map((option) => option.title);

      try {
        const result = await pathCollection.insertOne({
          title,
          initialContent,
          options: options.map((option) => ({ ...option, parentId })),
          postedTime,
          parentId,
          email,
          viewCount,
        });

        if (parentId) {
          await pathCollection.updateMany(
            { title: { $in: optionTitles } },
            { $set: { parentId } }
          );
        }

        res.json({ success: true, insertedId: result.insertedId });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
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
    // GET PATH BY EMAIL // //NOT USED
    // app.get("/get-path/:email", async (req, res) => {
    //     const myEmail = req.params.email.trim();
    //     try {
    //       const query = { email: myEmail };
    //       const result = await pathCollection.find(query).toArray();
    //       res.send(result);
    //     } catch (error) {
    //       console.error("Error fetching data:", error);
    //       res.status(500).send({ message: "Failed to fetch data" });
    //     }
    //   });

    app.put("/update-path/:id", async (req, res) => {
      const { id } = req.params;
      const { parentId } = req.body;

      try {
        const result = await pathCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { parentId } }
        );

        if (result.modifiedCount > 0) {
          res.json({
            success: true,
            message: "Parent ID updated successfully",
          });
        } else {
          res.json({ success: false, message: "Failed to update Parent ID" });
        }
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.put("/update-allpath", async (req, res) => {
      const { titles, parentId } = req.body;

      try {
        const result = await pathCollection.updateMany(
          { title: { $in: titles } },
          { $set: { parentId } }
        );

        if (result.modifiedCount > 0) {
          res.json({
            success: true,
            message: "All matching paths updated successfully",
          });
        } else {
          res.json({
            success: false,
            message: "No matching paths found or failed to update",
          });
        }
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.post("/check-options", async (req, res) => {
      const { titles } = req.body;

      try {
        const existingPaths = await pathCollection
          .find({ title: { $in: titles }, parentId: { $ne: "" } })
          .toArray();

        const existingTitles = existingPaths.map((path) => path.title);

        res.json({ success: true, existingTitles });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // GET SINGLE PATH //
    app.get("/path/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const query = { _id: new ObjectId(id) };
        const result = await pathCollection.findOne(query);
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
      try {
        const query = { _id: new ObjectId(id) };
        const result = await postStoryCollection.findOne(query);
        res.send(result);
      } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send({ message: "Failed to fetch data" });
      }
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
      try {
        const result = await postStoryCollection.updateOne(
          updatedId,
          updateMyBlog,
          options
        );
        res.send(result);
      } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send({ message: "Failed to fetch data" });
      }
    });
    //   UPDATE PATH //
    app.put("/path/:id", async (req, res) => {
      const id = req.params.id;
      const updatedId = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateBlog = req.body;
      const updateMyBlog = {
        $set: {
          title: updateBlog.title,
          initialContent: updateBlog.initialContent,
          options: updateBlog.options,
        },
      };
      try {
        const result = await pathCollection.updateOne(
          updatedId,
          updateMyBlog,
          options
        );
        res.send(result);
      } catch (error) {
        console.error("Error updating path:", error);
        res.status(500).send("Error updating path");
      }
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

    // STORY VIEW COUNT
    app.patch("/story-viewcount/:id", async (req, res) => {
      const id = req.params.id;
      console.log("Received request to update view count for ID:", id);
      try {
        const query = { _id: new ObjectId(id) };
        const update = { $inc: { viewCount: 1 } };
        const result = await postStoryCollection.updateOne(query, update);

        if (result.matchedCount === 0) {
          res.status(404).send({ message: "Story not found" });
          return;
        }

        console.log("View count updated successfully.");
        res.send({ message: "View count updated successfully" });
      } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send({ message: "Failed to fetch data" });
      }
    });
      
    //   PATH VIEW COUNT //
    app.patch("/option-viewcount/:id", async (req, res) => {
      const id = req.params.id;
      console.log("Received request to update view count for Option ID:", id);
      try {
        const query = { _id: new ObjectId(id) }; // Assuming the option has a similar ID structure
        const update = { $inc: { viewCount: 1 } };
        const result = await pathCollection.updateOne(query, update);

        if (result.matchedCount === 0) {
          res.status(404).send({ message: "Option not found" });
          return;
        }

        console.log("Option view count updated successfully.");
        res.send({ message: "Option view count updated successfully" });
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
    // DELETE PATH //
    app.delete("/path/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      try {
        const pathToDelete = await pathCollection.findOne(query);

        if (!pathToDelete) {
          return res
            .status(404)
            .json({ success: false, message: "Path not found" });
        }

        const { parentId } = pathToDelete;

        const deleteResult = await pathCollection.deleteOne(query);

        if (parentId) {
          const updateResult = await pathCollection.updateMany(
            { parentId },
            { $set: { parentId: "" } }
          );
        }

        if (deleteResult.deletedCount > 0) {
          res.json({ success: true, message: "Path deleted successfully" });
        } else {
          res.json({ success: false, message: "Failed to delete path" });
        }
      } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ success: false, error: error.message });
      }
    });
// UPDATE PATH PARENT ID  //
    app.patch("/update-paths-parent-id", async (req, res) => {
      const { parentId, newParentId } = req.body;

      try {
        const result = await pathCollection.updateMany(
          { parentId },
          { $set: { parentId: newParentId } }
        );

        if (result.modifiedCount > 0) {
          res.json({
            success: true,
            message: "Parent IDs updated successfully",
          });
        } else {
          res.json({
            success: false,
            message: "No matching paths found to update",
          });
        }
      } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ success: false, error: error.message });
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
