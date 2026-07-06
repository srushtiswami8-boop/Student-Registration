// backend/index.js
const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");

const app = express();
const db = new Database("data.db");

app.use(cors());
app.use(express.json());

db.prepare(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    created_at TEXT NOT NULL
  )
`).run();

// 1) POST /products
app.post("/products", (req, res) => {
  try {
    const { name, category, quantity, price } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Product name is required" });
    }

    if (!category || !category.trim()) {
      return res.status(400).json({ message: "Category is required" });
    }

    const parsedQuantity = Number(quantity);
    const parsedPrice = Number(price);

    if (Number.isNaN(parsedQuantity) || parsedQuantity < 0) {
      return res.status(400).json({ message: "Quantity must be 0 or greater" });
    }

    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ message: "Price must be greater than 0" });
    }

    const created_at = new Date().toISOString();

    const insert = db.prepare(`
      INSERT INTO products (name, category, quantity, price, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      name.trim(),
      category.trim(),
      parsedQuantity,
      parsedPrice,
      created_at
    );

    const product = db
      .prepare("SELECT * FROM products WHERE id = ?")
      .get(result.lastInsertRowid);

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: "Failed to create product" });
  }
});

// 2) GET /products
app.get("/products", (req, res) => {
  try {
    const products = db
      .prepare("SELECT * FROM products ORDER BY created_at DESC")
      .all();

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

// 3) GET /products/:id
app.get("/products/:id", (req, res) => {
  try {
    const id = Number(req.params.id);

    const product = db.prepare("SELECT * FROM products WHERE id = ?").get(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch product" });
  }
});

// 4) PUT /products/:id
app.put("/products/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, category, quantity, price } = req.body;

    const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
    if (!existing) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Product name is required" });
    }

    if (!category || !category.trim()) {
      return res.status(400).json({ message: "Category is required" });
    }

    const parsedQuantity = Number(quantity);
    const parsedPrice = Number(price);

    if (Number.isNaN(parsedQuantity) || parsedQuantity < 0) {
      return res.status(400).json({ message: "Quantity must be 0 or greater" });
    }

    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ message: "Price must be greater than 0" });
    }

    db.prepare(`
      UPDATE products
      SET name = ?, category = ?, quantity = ?, price = ?
      WHERE id = ?
    `).run(name.trim(), category.trim(), parsedQuantity, parsedPrice, id);

    const updatedProduct = db
      .prepare("SELECT * FROM products WHERE id = ?")
      .get(id);

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: "Failed to update product" });
  }
});

// 5) PATCH /products/:id/stock
app.patch("/products/:id/stock", (req, res) => {
  try {
    const id = Number(req.params.id);
    const { quantity } = req.body;

    const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
    if (!existing) {
      return res.status(404).json({ message: "Product not found" });
    }

    const parsedQuantity = Number(quantity);

    if (Number.isNaN(parsedQuantity) || parsedQuantity < 0) {
      return res.status(400).json({ message: "Quantity must be 0 or greater" });
    }

    db.prepare("UPDATE products SET quantity = ? WHERE id = ?").run(parsedQuantity, id);

    const updatedProduct = db
      .prepare("SELECT * FROM products WHERE id = ?")
      .get(id);

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: "Failed to update stock" });
  }
});

// 6) DELETE /products/:id
app.delete("/products/:id", (req, res) => {
  try {
    const id = Number(req.params.id);

    const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
    if (!existing) {
      return res.status(404).json({ message: "Product not found" });
    }

    db.prepare("DELETE FROM products WHERE id = ?").run(id);

    res.json({
      message: "Product deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete product" });
  }
});

// 7) GET /dashboard
app.get("/dashboard", (req, res) => {
  try {
    const totalProductsRow = db.prepare("SELECT COUNT(*) AS count FROM products").get();
    const totalQuantityRow = db.prepare("SELECT SUM(quantity) AS total FROM products").get();
    const inventoryValueRow = db.prepare("SELECT SUM(quantity * price) AS total FROM products").get();
    const lowStockItems = db
      .prepare("SELECT * FROM products WHERE quantity < 5 ORDER BY created_at DESC")
      .all();

    res.json({
      totalProducts: totalProductsRow.count || 0,
      totalQuantity: totalQuantityRow.total || 0,
      inventoryValue: inventoryValueRow.total || 0,
      lowStockItems
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch dashboard data" });
  }
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});