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

// ==========================================
// ENDPOINT AUTENTIKASI (REGISTER & LOGIN)
// ==========================================

// 1. Endpoint Register (Karyawan / Admin / Owner)
app.post('/api/auth/register', async (req, res) => {
  const { email, password, role } = req.body;
  
  try {
    // Validasi input role wajib diisi dan sesuai ketentuan
    if (!['karyawan', 'admin', 'owner'].includes(role)) {
      return res.status(400).json({ error: 'Role tidak valid! Pilih karyawan, admin, atau owner.' });
    }

    // A. Daftarkan akun ke Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    if (authData.user) {
      // B. Masukkan data profil dan role ke tabel public.profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          { id: authData.user.id, email: email, role: role }
        ]);

      if (profileError) throw profileError;
    }

    res.json({ success: true, message: `Registrasi berhasil sebagai ${role}!` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Endpoint Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // A. Verifikasi email & password lewat Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) return res.status(400).json({ error: authError.message });

    // B. Ambil data role pengguna dari tabel profiles berdasarkan ID user yang sukses login
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single();

    if (profileError) throw profileError;

    // C. Kirim data token session beserta role-nya ke Frontend
    res.json({
      success: true,
      message: 'Login berhasil!',
      token: authData.session.access_token,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: profileData.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export aplikasi untuk Vercel Serverless
module.exports = app;