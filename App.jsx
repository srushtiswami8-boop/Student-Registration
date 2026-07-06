// frontend/src/App.jsx
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000";

function App() {
  const [products, setProducts] = useState([]);
  const [dashboard, setDashboard] = useState({
    totalProducts: 0,
    totalQuantity: 0,
    inventoryValue: 0,
    lowStockItems: [],
  });

  const [form, setForm] = useState({
    name: "",
    category: "",
    quantity: "",
    price: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    quantity: "",
    price: "",
  });

  const refreshAll = async () => {
    try {
      const [productsRes, dashboardRes] = await Promise.all([
        fetch(`${API_URL}/products`),
        fetch(`${API_URL}/dashboard`),
      ]);

      const productsData = await productsRes.json();
      const dashboardData = await dashboardRes.json();

      setProducts(Array.isArray(productsData) ? productsData : []);
      setDashboard(
        dashboardData || {
          totalProducts: 0,
          totalQuantity: 0,
          inventoryValue: 0,
          lowStockItems: [],
        }
      );
    } catch (error) {
      console.error("Failed to refresh data:", error);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();

    try {
      await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          quantity: Number(form.quantity),
          price: Number(form.price),
        }),
      });

      setForm({
        name: "",
        category: "",
        quantity: "",
        price: "",
      });

      await refreshAll();
    } catch (error) {
      console.error("Failed to add product:", error);
    }
  };

  const startEditing = (product) => {
    setEditingId(product.id);
    setEditForm({
      name: product.name,
      category: product.category,
      quantity: product.quantity,
      price: product.price,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({
      name: "",
      category: "",
      quantity: "",
      price: "",
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdate = async (id) => {
    try {
      await fetch(`${API_URL}/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editForm.name,
          category: editForm.category,
          quantity: Number(editForm.quantity),
          price: Number(editForm.price),
        }),
      });

      setEditingId(null);
      await refreshAll();
    } catch (error) {
      console.error("Failed to update product:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_URL}/products/${id}`, {
        method: "DELETE",
      });

      await refreshAll();
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
  };

  const handleStockUpdate = async (id, newQuantity) => {
    try {
      await fetch(`${API_URL}/products/${id}/stock`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quantity: Number(newQuantity),
        }),
      });

      await refreshAll();
    } catch (error) {
      console.error("Failed to update stock:", error);
    }
  };

  return (
    <div className="app">
      <div className="container">
        <h1>📦 Inventory Manager</h1>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Total Products</h3>
            <p>{dashboard.totalProducts}</p>
          </div>

          <div className="dashboard-card">
            <h3>Total Quantity</h3>
            <p>{dashboard.totalQuantity}</p>
          </div>

          <div className="dashboard-card">
            <h3>Inventory Value</h3>
            <p>₹{Number(dashboard.inventoryValue || 0).toFixed(2)}</p>
          </div>

          <div className="dashboard-card">
            <h3>Low Stock Items</h3>
            <p>{dashboard.lowStockItems?.length || 0}</p>
          </div>
        </div>

        <div className="card form-card">
          <h2>Add Product</h2>
          <form onSubmit={handleAddProduct} className="product-form">
            <input
              type="text"
              name="name"
              placeholder="Product Name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="category"
              placeholder="Category"
              value={form.category}
              onChange={handleChange}
              required
            />
            <input
              type="number"
              name="quantity"
              placeholder="Quantity"
              value={form.quantity}
              onChange={handleChange}
              min="0"
              required
            />
            <input
              type="number"
              name="price"
              placeholder="Price"
              value={form.price}
              onChange={handleChange}
              min="0.01"
              step="0.01"
              required
            />
            <button type="submit" className="btn btn-primary">
              Add Product
            </button>
          </form>
        </div>

        <div className="products-section">
          <h2>Products</h2>

          {products.length === 0 ? (
            <div className="empty-state">No products found.</div>
          ) : (
            <div className="products-grid">
              {products.map((product) => (
                <div key={product.id} className="card product-card">
                  {editingId === product.id ? (
                    <>
                      <input
                        type="text"
                        name="name"
                        value={editForm.name}
                        onChange={handleEditChange}
                        placeholder="Product Name"
                      />
                      <input
                        type="text"
                        name="category"
                        value={editForm.category}
                        onChange={handleEditChange}
                        placeholder="Category"
                      />
                      <input
                        type="number"
                        name="quantity"
                        value={editForm.quantity}
                        onChange={handleEditChange}
                        min="0"
                        placeholder="Quantity"
                      />
                      <input
                        type="number"
                        name="price"
                        value={editForm.price}
                        onChange={handleEditChange}
                        min="0.01"
                        step="0.01"
                        placeholder="Price"
                      />

                      <div className="button-row">
                        <button
                          className="btn btn-primary"
                          onClick={() => handleUpdate(product.id)}
                        >
                          Save
                        </button>
                        <button className="btn btn-secondary" onClick={cancelEditing}>
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3>{product.name}</h3>
                      <p><strong>Category:</strong> {product.category}</p>
                      <p><strong>Quantity:</strong> {product.quantity}</p>
                      <p><strong>Price:</strong> ₹{Number(product.price).toFixed(2)}</p>

                      <div className="stock-row">
                        <button
                          className="stock-btn"
                          onClick={() =>
                            handleStockUpdate(product.id, Math.max(0, product.quantity - 1))
                          }
                        >
                          -1
                        </button>
                        <span className="stock-label">Stock</span>
                        <button
                          className="stock-btn"
                          onClick={() => handleStockUpdate(product.id, product.quantity + 1)}
                        >
                          +1
                        </button>
                      </div>

                      <div className="button-row">
                        <button
                          className="btn btn-primary"
                          onClick={() => startEditing(product)}
                        >
                          Update
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDelete(product.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;