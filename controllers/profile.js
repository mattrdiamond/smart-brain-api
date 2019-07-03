const handleGetProfile = (req, res, database) => {
  const { id } = req.params;
  database
    .select("*")
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
};

module.exports = {
  handleGetProfile: handleGetProfile
};
