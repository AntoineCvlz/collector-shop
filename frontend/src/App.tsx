import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";

const AdminCategories = lazy(() => import("./pages/AdminCategories"));
const AdminModeration = lazy(() => import("./pages/AdminModeration"));
const AdminSellers = lazy(() => import("./pages/AdminSellers"));
const ArticleDetail = lazy(() => import("./pages/ArticleDetail"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Login = lazy(() => import("./pages/Login"));
const Orders = lazy(() => import("./pages/Orders"));
const Profile = lazy(() => import("./pages/Profile"));
const Register = lazy(() => import("./pages/Register"));
const SellArticle = lazy(() => import("./pages/SellArticle"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1 },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/articles/:id" element={<ArticleDetail />} />
            <Route path="/articles/:id/checkout" element={<Checkout />} />
            <Route path="/sell" element={<SellArticle />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/moderation" element={<AdminModeration />} />
            <Route path="/admin/sellers" element={<AdminSellers />} />
            {/* Catch-all : toute URL inconnue (ex. /index.html) renvoie à l'accueil. */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
