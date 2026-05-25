const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-client');
require('dotenv').config();

const app = express();

// Konfigurasi CORS agar Frontend bisa mengakses API ini
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Inisialisasi Klien Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 1. Endpoint GET: Mengambil semua data produk/barang
app.get('/api/products', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Endpoint POST: Menambah barang baru ke database
app.post('/api/products', async (req, res) => {
  const { name, stock, category, description } = req.body;
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([{ name, stock: parseInt(stock), category, description }])
      .select();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Endpoint PUT: Mengupdate stok atau data barang
app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const { name, stock, category, description } = req.body;
  try {
    const { data, error } = await supabase
      .from('products')
      .update({ name, stock: parseInt(stock), category, description })
      .eq('id', id)
      .select();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Endpoint DELETE: Menghapus barang dari gudang
app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true, message: 'Barang berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export aplikasi untuk Vercel Serverless
module.exports = app;