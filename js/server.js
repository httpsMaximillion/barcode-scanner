const express = require("express");
const path = require("path");
const cors = require("cors");
const fs = require("fs");
const { parse } = require("json2csv");
const Database = require("better-sqlite3");
const app = express();
const port = 8080;

const db = new Database("books.db");

const createTable = `
 CREATE TABLE IF NOT EXISTS books (
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   box_number INTEGER,
   isbn_number INTEGER UNIQUE,
   condition TEXT,
   title TEXT,
   author TEXT,
   publisher TEXT,
   cover TEXT,
   amazon TEXT
 );
`;

db.prepare(createTable).run();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "../css")));
app.use(express.static(path.join(__dirname, "../img")));
app.use(express.static(path.join(__dirname, "../js")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../html", "index.html"));
});

app.post("/add-book", (req, res) => {
  const {
    box_number,
    isbn_number,
    condition,
    title,
    author,
    publisher,
    cover,
    amazon,
  } = req.body;

  if (
    !box_number ||
    !isbn_number ||
    !condition ||
    !title ||
    !author ||
    !publisher
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const checkDuplicate = db.prepare(
      "SELECT * FROM books WHERE isbn_number = ?"
    );
    const existingBook = checkDuplicate.get(isbn_number);

    if (existingBook) {
      return res
        .status(400)
        .json({ error: "This book already exists in the database." });
    }

    const insert = db.prepare(`
      INSERT INTO books (box_number, isbn_number, condition, title, author, publisher, cover, amazon)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      box_number,
      isbn_number,
      condition,
      title,
      author,
      publisher,
      cover,
      amazon
    );

    res.status(201).json({ message: "Book added successfully" });
  } catch (error) {
    console.error("Error inserting book:", error);
    res.status(500).json({ error: "Failed to add the book" });
  }
});

app.get("/download-csv", (req, res) => {
  const query = "SELECT * FROM books";

  try {
    const rows = db.prepare(query).all();
    const csv = parse(rows);

    const filePath = path.join(__dirname, "../books.csv");
    fs.writeFileSync(filePath, csv);

    res.download(filePath, "../books.csv", (err) => {
      if (err) {
        console.error("Error sending file:", err);
        res.status(500).send("Error generating CSV.");
      }
    });
  } catch (error) {
    console.error("Error converting database to CSV:", error);
    res.status(500).send("Error converting database to CSV.");
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});