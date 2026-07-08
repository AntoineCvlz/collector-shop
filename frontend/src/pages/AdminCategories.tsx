import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Check, Pencil, Plus, Trash2, X } from "lucide-react";

import Footer from "../components/Footer";
import Header from "../components/Header";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
  type Category,
} from "../services/category.service";
import { getToken, getUser, isAdmin } from "../lib/auth";

export default function AdminCategories() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = getToken();
  const user = getUser();

  useEffect(() => {
    if (!token) {
      navigate("/login");
    } else if (!isAdmin(user)) {
      navigate("/");
    }
  }, [token, user, navigate]);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
    enabled: Boolean(token) && isAdmin(user),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["categories"] });

  if (!token || !isAdmin(user)) {
    return null;
  }

  return (
    <div className="flex min-h-svh flex-col bg-secondary/30">
      <Header />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <header className="mb-6">
          <p className="text-xs font-semibold tracking-[0.2em] text-coral uppercase">
            {t("roles.admin")}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
            {t("admin.categoriesTitle")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("admin.categoriesSubtitle")}
          </p>
        </header>

        <CreateCategory token={token} onCreated={invalidate} />

        <section className="mt-6 rounded-2xl border border-border bg-card">
          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">
              {t("common.loading")}
            </p>
          ) : categories.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              {t("admin.noCategories")}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {categories.map((category) => (
                <CategoryRow
                  key={category.id}
                  category={category}
                  token={token}
                  onChanged={invalidate}
                />
              ))}
            </ul>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

interface CreateCategoryProps {
  token: string;
  onCreated: () => void;
}

function CreateCategory({ token, onCreated }: CreateCategoryProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");

  const mutation = useMutation({
    mutationFn: () => createCategory(token, name),
    onSuccess: () => {
      setName("");
      onCreated();
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.mutate();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-card p-4"
      aria-label="Create category"
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          aria-label={t("admin.newCategory")}
          placeholder={t("admin.newCategory")}
          minLength={2}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11"
        />
        <Button
          type="submit"
          className="h-11 shrink-0 rounded-full font-semibold"
          disabled={mutation.isPending}
        >
          <Plus className="size-4" />
          {mutation.isPending ? t("admin.adding") : t("admin.addCategory")}
        </Button>
      </div>
      {mutation.isError && (
        <p
          role="alert"
          className="mt-2 flex items-center gap-2 text-sm text-destructive"
        >
          <AlertCircle className="size-4 shrink-0" />
          {t("admin.createError")}
        </p>
      )}
    </form>
  );
}

interface CategoryRowProps {
  category: Category;
  token: string;
  onChanged: () => void;
}

function CategoryRow({ category, token, onChanged }: CategoryRowProps) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);

  const update = useMutation({
    mutationFn: () => updateCategory(token, category.id, name),
    onSuccess: () => {
      setEditing(false);
      onChanged();
    },
  });

  const remove = useMutation({
    mutationFn: () => deleteCategory(token, category.id),
    onSuccess: onChanged,
  });

  if (editing) {
    return (
      <li className="flex items-center gap-2 p-4">
        <Input
          aria-label={t("common.edit")}
          value={name}
          minLength={2}
          onChange={(e) => setName(e.target.value)}
          className="h-10"
        />
        <Button
          type="button"
          size="icon"
          className="size-10 shrink-0 rounded-full"
          onClick={() => update.mutate()}
          disabled={update.isPending}
          aria-label={t("common.save")}
        >
          <Check className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="size-10 shrink-0 rounded-full"
          onClick={() => {
            setName(category.name);
            setEditing(false);
          }}
          aria-label={t("common.cancel")}
        >
          <X className="size-4" />
        </Button>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-3 p-4">
      <div>
        <p className="font-medium">{category.name}</p>
        <p className="text-xs text-muted-foreground">/{category.slug}</p>
      </div>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-9 rounded-full"
          onClick={() => setEditing(true)}
          aria-label={`${t("common.edit")} ${category.name}`}
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-9 rounded-full text-destructive hover:bg-destructive/10"
          onClick={() => {
            if (window.confirm(t("admin.confirmRemove", { title: category.name }))) {
              remove.mutate();
            }
          }}
          disabled={remove.isPending}
          aria-label={`${t("common.delete")} ${category.name}`}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </li>
  );
}
