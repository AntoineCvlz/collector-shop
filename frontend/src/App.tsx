import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AdminCategories from "./pages/AdminCategories";
import AdminModeration from "./pages/AdminModeration";
import AdminSellers from "./pages/AdminSellers";
import ArticleDetail from "./pages/ArticleDetail";
import Checkout from "./pages/Checkout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import SellArticle from "./pages/SellArticle";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/articles/:id" element={<ArticleDetail />} />
          <Route path="/articles/:id/checkout" element={<Checkout />} />
          <Route path="/sell" element={<SellArticle />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/moderation" element={<AdminModeration />} />
          <Route path="/admin/sellers" element={<AdminSellers />} />
          {/* Catch-all : toute URL inconnue (ex. /index.html) renvoie à l'accueil. */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
