const handleRegister = (req, res, database, bcrypt) => {
  const { email, name, password } = req.body;
  if (!email || !name || !password) {
    return res.status(400).json("incorrect form submission");
  }
  const hash = bcrypt.hashSync(password); // encrypt password
  database
    .transaction(trx => {
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
        .catch(trx.rollback); // any failure - database will rollback to prev state
    })
    .catch(err => res.status(400).json("unable to join"));
};

module.exports = {
  handleRegister: handleRegister
};
