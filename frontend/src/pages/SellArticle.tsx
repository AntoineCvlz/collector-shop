import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, ImagePlus, X } from "lucide-react";

import Footer from "../components/Footer";
import Header from "../components/Header";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { getToken, getUser, isSeller } from "../lib/auth";
import { createArticle } from "../services/article.service";
import { listCategories } from "../services/category.service";

export default function SellArticle() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = getToken();
  const user = getUser();

  useEffect(() => {
    if (!token) {
      navigate("/login");
    } else if (!isSeller(user)) {
      navigate("/profile");
    }
  }, [token, user, navigate]);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
    enabled: Boolean(token) && isSeller(user),
  });

  const [categoryId, setCategoryId] = useState<number | "">("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [shipping, setShipping] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      createArticle(token as string, {
        category_id: Number(categoryId),
        title,
        description,
        price: Number(price),
        shipping_cost: shipping ? Number(shipping) : 0,
        images,
      }),
    onSuccess: () => setSubmitted(true),
  });

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setImages((prev) => [...prev, ...Array.from(files)].slice(0, 6));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.mutate();
  };

  if (!token || !isSeller(user)) {
    return null;
  }

  return (
    <div className="flex min-h-svh flex-col bg-secondary/30">
      <Header />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight">
          {t("sell.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("sell.subtitle")}</p>

        {submitted ? (
          <div className="mt-8 rounded-2xl border border-coral/30 bg-coral/5 p-8 text-center">
            <CheckCircle2 className="mx-auto size-10 text-coral" />
            <h2 className="mt-4 text-xl font-bold">{t("sell.submittedTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("sell.submittedBody")}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button
                className="rounded-full font-semibold"
                onClick={() => navigate("/profile")}
              >
                {t("sell.goToProfile")}
              </Button>
              <Button
                variant="outline"
                className="rounded-full font-semibold"
                onClick={() => window.location.reload()}
              >
                {t("sell.listAnother")}
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-8 flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 sm:p-8"
            aria-label="Create listing form"
          >
            <div className="flex flex-col gap-1.5">
              <label htmlFor="category" className="text-sm font-medium">
                {t("sell.category")}
              </label>
              <select
                id="category"
                required
                value={categoryId}
                onChange={(e) =>
                  setCategoryId(e.target.value ? Number(e.target.value) : "")
                }
                className="h-11 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <option value="">{t("sell.selectCategory")}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="title" className="text-sm font-medium">
                {t("sell.titleField")}
              </label>
              <Input
                id="title"
                required
                minLength={3}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-11"
                placeholder={t("sell.titlePlaceholder")}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="description" className="text-sm font-medium">
                {t("sell.description")}
              </label>
              <textarea
                id="description"
                required
                minLength={10}
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                placeholder={t("sell.descriptionPlaceholder")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="price" className="text-sm font-medium">
                  {t("sell.price")}
                </label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="shipping" className="text-sm font-medium">
                  {t("sell.shipping")}
                </label>
                <Input
                  id="shipping"
                  type="number"
                  min="0"
                  step="0.01"
                  value={shipping}
                  onChange={(e) => setShipping(e.target.value)}
                  className="h-11"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">{t("sell.photos")}</span>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border py-6 text-sm text-muted-foreground transition-colors hover:border-coral/50 hover:text-foreground">
                <ImagePlus className="size-5" />
                {t("sell.addPhotos")}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </label>
              {images.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {images.map((file, i) => (
                    <li
                      key={`${file.name}-${i}`}
                      className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs"
                    >
                      <span className="max-w-32 truncate">{file.name}</span>
                      <button
                        type="button"
                        aria-label={`Remove ${file.name}`}
                        onClick={() =>
                          setImages((prev) => prev.filter((_, j) => j !== i))
                        }
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {mutation.isError && (
              <p
                role="alert"
                className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                <AlertCircle className="size-4 shrink-0" />
                {t("sell.error")}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="h-12 rounded-full font-semibold"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? t("sell.submitting") : t("sell.submit")}
            </Button>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
}
