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
  db.select("email", "hash")
    .from("login")
    .where("email", "=", req.body.email)
    .then(data => {
      const isValid = bcrypt.compareSync(req.body.password, data[0].hash); // compare entered pw with hash
      if (isValid) {
        return db
          .select("*")
          .from("users")
          .where("email", "=", req.body.email)
          .then(user => {
            res.json(user[0]);
          })
          .catch(err => res.status(400).json("unable to get user"));
      } else {
        res.status(400).json("wrong credentials");
      }
    })
    .catch(err => res.status(400).json("wrong credentials"));
});

app.post("/register", (req, res) => {
  const { email, name, password } = req.body;
  const hash = bcrypt.hashSync(password); // encrypt password
  db.transaction(trx => {
    // if transaction to one table fails, all transactions will fail - kinex
    trx
      .insert({
        // first transaction - add hash and email to login table
        hash: hash, // from bcrypt
        email: email // from req.body
      })
      .into("login")
      .returning("email")
      .then(loginEmail => {
        // second transaction - update users table with email
        return trx("users") // register new user in database (knex)
          .returning("*") // users -> insert user and return all columns (knex)
          .insert({
            email: loginEmail[0],
            name: name,
            joined: new Date()
          })
          .then(user => {
            res.json(user[0]); // user returns user object in array. user[0] returns just object of registered user
          });
      })
      .then(trx.commit) // if both transactions pass, then commit
      .catch(trx.rollback); // any failure - db will rollback to prev state
  }).catch(err => res.status(400).json("unable to join"));
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
