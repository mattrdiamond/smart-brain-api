const express = require("express");
const bcrypt = require("bcrypt-nodejs");
const cors = require("cors"); //middleware to fix CORS error and allow us to test on localhost
const bodyParser = require("body-parser"); // when sending json data from front end, we need to parse it for express to understand --> body-parser
const knex = require("knex");

const db = knex({
  client: "pg", //PostgreSQL
  connection: {
    host: "127.0.0.1",
    user: "matt_diamond",
    password: "",
    database: "smart-brain"
  }
});

db.select("*")
  .from("users")
  .then(data => {
    console.log(data);
  });

const app = express();

app.use(bodyParser.json());
app.use(cors());

const database = {
  users: [
    {
      id: "123",
      name: "John",
      password: "cookies",
      email: "john@gmail.com",
      entries: 0, //how many times john has submitted photos for face detection
      joined: new Date()
    },
    {
      id: "124",
      name: "Sally",
      password: "bananas",
      email: "sally@gmail.com",
      entries: 0,
      joined: new Date()
    }
  ],
  login: [
    {
      id: "987",
      hash: "",
      email: "john@gmail.com"
    }
  ]
};

app.get("/", (req, res) => {
  res.send(database.users);
});

app.post("/signin", (req, res) => {
  if (
    req.body.email === database.users[0].email &&
    req.body.password === database.users[0].password
  ) {
    // res.json("success");
    res.json(database.users[0]);
  } else {
    res.status(400).json("error logging in");
  }
});

app.post("/register", (req, res) => {
  const { email, name, password } = req.body;
  return db("users") // register new user in database (knex)
    .returning("*") // users -> insert user and return all columns (knex)
    .insert({
      email: email,
      name: name,
      joined: new Date()
    })
    .then(user => {
      res.json(user[0]); // user returns user object in array. user[0] returns just object of registered user
    })
    .catch(err => res.status(400).json("unable to join"));
});

app.get("/profile/:id", (req, res) => {
  const { id } = req.params;
  db.select("*")
    .from("users")
    .where({
      id: id
    })
    .then(user => {
      // if user exists
      if (user.length) {
        res.json(user[0]); // respond with user
      } else {
        res.status(400).json("Not found");
      }
    })
    .catch(err => res.status(400).json("error getting user"));
});

app.put("/image", (req, res) => {
  const { id } = req.body;
  db("users")
    .where("id", "=", id)
    .increment("entries", 1)
    .returning("entries")
    .then(entries => {
      res.json(entries[0]);
    })
    .catch(err => res.status(400).json("unable to get entries"));
});

app.listen(3000, () => {
  console.log("running on port 3000");
});

/*
/ --> res = this is working
/signin --> POST = success/fail
/register --> POST = user
/profile/:userId --> GET = user
/image --> PUT(update) --> user
*/
