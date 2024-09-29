const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(cors());

app.listen(4000, () => {
  console.log("server running at http://localhost:4000");
});

const db = new sqlite3.Database("userAddresses.db", (err) => {
  if (err) {
    console.error("error while connecting to database", err.message);
  } else {
    console.log("connected to the SQLite database.");

    db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL
        )
      `);

    db.run(`
        CREATE TABLE IF NOT EXISTS addresses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          city TEXT,
          state TEXT,
          zipCode TEXT,
          userId INTEGER,
          FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
        )
      `);
  }
});

app.post("/add-address", async (req, res) => {
  const { name, city, state, zipCode } = req.body;

  const userQuery = `
          INSERT INTO users(name) VALUES('${name}')
      `;
  db.run(userQuery, function (err) {
    if (err) {
      res.status(500).send("error while adding user");
    } else {
      const userId = this.lastID;

      const addressQuery = `
      INSERT INTO addresses (city, state, zipCode, userId) 
      VALUES ('${city}', '${state}', '${zipCode}', '${userId}')
    `;
      db.run(addressQuery, (err) => {
        if (err) {
          return res.status(500).send("failed to add address");
        }

        res.status(200).send("address added successfully");
      });
    }
  });
});

app.get("/users", (req, res) => {
  const query = `
      SELECT 
      users.id, 
      users.name, 
      addresses.city, 
      addresses.state, 
      addresses.zipCode
    FROM users
    LEFT JOIN addresses ON users.id = addresses.userId
    `;

  db.all(query, (err, rows) => {
    if (err) {
      return res.status(500).send("failed to retrieve users");
    } else {
      console.log(rows);
      res.status(200).json(rows);
    }
  });
});
