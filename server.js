const express = require("express");
const bcrypt = require("bcrypt-nodejs");
const cors = require("cors"); //middleware to fix CORS error and allow us to test on localhost
const bodyParser = require("body-parser"); // when sending json data from front end, we need to parse it for express to understand --> body-parser
const knex = require("knex");
const register = require("./controllers/register");
const signin = require("./controllers/signin");
const profile = require("./controllers/profile");
const image = require("./controllers/image");

const database = knex({
  client: "pg", //PostgreSQL
  connection: {
    host: "127.0.0.1",
    user: "matt_diamond",
    password: "",
    database: "smart-brain"
  }
});

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send(database.users);
});

app.post("/signin", (req, res) => {
  signin.handleSignin(req, res, database, bcrypt);
});

app.post("/register", (req, res) => {
  register.handleRegister(req, res, database, bcrypt);
});

app.get("/profile/:id", (req, res) => {
  profile.handleGetProfile(req, res, database);
});

app.put("/image", (req, res) => {
  image.handleImage(req, res, database);
});

app.post("/imageurl", (req, res) => {
  image.handleApiCall(req, res);
});

app.listen(3000, () => {
  console.log("running on port 3000");
});
