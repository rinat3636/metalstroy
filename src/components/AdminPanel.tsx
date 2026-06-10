import { useCallback, useEffect, useMemo, useState } from "react";
import type { Category, Product, StockStatus } from "@/lib/types";

const STOCK_OPTIONS: { value: StockStatus; label: string }[] = [
  { value: "in_stock", label: "В наличии" },
  { value: "on_order", label: "Под заказ" },
  { value: "out_of_stock", label: "Нет в наличии" },
];

const emptyForm = {
  title: "",
  category: "",
  categorySlug: "",
  subcategory: "",
  price: "",
  stock: "on_order" as StockStatus,
  specsRaw: "",
  description: "",
  image: "",
};

function imageUrl(image?: string): string {
  if (!image) return "/assets/placeholder-product.svg";
  return `/assets/catalog-images/${encodeURIComponent(image)}`;
}

export default function AdminPanel() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [editingSku, setEditingSku] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_token");
    if (saved) setToken(saved);
  }, []);

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }),
    [token],
  );

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const loadCategories = useCallback(async () => {
    const res = await fetch("/api/products");
    const data = await res.json();
    setCategories(data.categories ?? []);
  }, []);

  useEffect(() => {
    if (token) loadCategories();
  }, [token, loadCategories]);

  function login(e: React.FormEvent) {
    e.preventDefault();
    sessionStorage.setItem("admin_token", password);
    setToken(password);
    setStatus("");
  }

  function logout() {
    sessionStorage.removeItem("admin_token");
    setToken("");
    setPassword("");
  }

  function resetForm() {
    setEditingSku(null);
    setForm(emptyForm);
    setFile(null);
    setPreview("");
    setStatus("");
  }

  function fillForm(product: Product) {
    setEditingSku(product.sku);
    setForm({
      title: product.title,
      category: product.category,
      categorySlug: product.categorySlug,
      subcategory: product.subcategory ?? "",
      price: product.price != null ? String(product.price) : "",
      stock: product.stock,
      specsRaw: product.specsRaw,
      description: product.description,
      image: product.image ?? "",
    });
    setPreview(imageUrl(product.image));
    setFile(null);
    setStatus(`Редактирование: ${product.sku}`);
  }

  async function runSearch(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products?q=${encodeURIComponent(search)}`, { headers: authHeaders });
      if (res.status === 401) throw new Error("Неверный пароль");
      const data = await res.json();
      setResults(data.products ?? []);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Ошибка поиска");
    } finally {
      setLoading(false);
    }
  }

  async function loadBySku(sku: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products?sku=${encodeURIComponent(sku)}`, { headers: authHeaders });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Не найдено");
      fillForm(data.product);
      setSearch(sku);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }

  async function uploadImage(skuForName?: string): Promise<string | undefined> {
    if (!file) return form.image || undefined;
    const body = new FormData();
    body.append("file", file);
    if (skuForName) body.append("sku", skuForName);
    const res = await fetch("/api/admin/upload", { method: "POST", headers: authHeaders, body });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Ошибка загрузки фото");
    return data.filename as string;
  }

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus("");
    try {
      const payload = {
        ...form,
        price: form.price === "" ? null : Number(form.price),
      };

      if (editingSku) {
        const image = await uploadImage(editingSku);
        const res = await fetch(`/api/admin/products/${encodeURIComponent(editingSku)}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({ ...payload, image: image ?? form.image }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Ошибка сохранения");
        setStatus(`Товар ${data.product.sku} обновлён`);
        fillForm(data.product);
      } else {
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Ошибка создания");
        const image = await uploadImage(data.product.sku);
        if (image) {
          await fetch(`/api/admin/products/${encodeURIComponent(data.product.sku)}`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ ...payload, image }),
          });
          data.product.image = image;
        }
        setStatus(`Создан товар ${data.product.sku}`);
        fillForm(data.product);
      }
      await runSearch();
      await loadCategories();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  async function removeProduct() {
    if (!editingSku) return;
    if (!confirm(`Удалить товар ${editingSku}?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${encodeURIComponent(editingSku)}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка удаления");
      setStatus(`Товар ${editingSku} удалён`);
      resetForm();
      await runSearch();
      await loadCategories();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Ошибка удаления");
    } finally {
      setLoading(false);
    }
  }

  function onCategoryChange(name: string) {
    const cat = categories.find((c) => c.name === name);
    setForm((f) => ({
      ...f,
      category: name,
      categorySlug: cat?.slug ?? "",
    }));
  }

  function onFileChange(f: File | null) {
    setFile(f);
    if (f) setPreview(URL.createObjectURL(f));
    else setPreview(form.image ? imageUrl(form.image) : "");
  }

  if (!token) {
    return (
      <div className="admin-shell">
        <form className="admin-card admin-login" onSubmit={login}>
          <h1>Админка каталога</h1>
          <p>Введите пароль администратора</p>
          <label className="field wide">
            <span>Пароль</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <button className="btn btn--accent" type="submit">Войти</button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <div className="admin-top">
        <div>
          <h1>Управление каталогом</h1>
          <p className="admin-muted">Добавление, поиск по артикулу, редактирование и удаление товаров</p>
        </div>
        <div className="admin-top__actions">
          <button className="btn btn--outline" type="button" onClick={resetForm}>Новый товар</button>
          <button className="btn btn--ghost" type="button" onClick={logout}>Выйти</button>
        </div>
      </div>

      <form className="admin-card" onSubmit={runSearch}>
        <h2>Поиск по артикулу или названию</h2>
        <div className="admin-row">
          <label className="field" style={{ flex: 1 }}>
            <span>Артикул / название</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="МТЛ-20001 или труба 40х20"
            />
          </label>
          <button className="btn btn--steel" type="submit" disabled={loading}>Найти</button>
        </div>
        {results.length > 0 && (
          <div className="admin-results">
            {results.slice(0, 20).map((p) => (
              <button key={p.sku} type="button" className="admin-result" onClick={() => fillForm(p)}>
                <strong>{p.sku}</strong>
                <span>{p.title}</span>
              </button>
            ))}
          </div>
        )}
      </form>

      <form className="admin-card" onSubmit={saveProduct}>
        <h2>{editingSku ? `Редактирование ${editingSku}` : "Новый товар"}</h2>
        {!editingSku && <p className="admin-muted">Артикул присвоится автоматически (МТЛ-20XXX)</p>}

        <div className="admin-grid">
          <label className="field">
            <span>Название *</span>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </label>
          <label className="field">
            <span>Категория *</span>
            <select value={form.category} onChange={(e) => onCategoryChange(e.target.value)} required>
              <option value="">Выберите категорию</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.name}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Подкатегория</span>
            <input value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} />
          </label>
          <label className="field">
            <span>Цена, ₽</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="по запросу — оставьте пустым"
            />
          </label>
          <label className="field">
            <span>Наличие</span>
            <select value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value as StockStatus })}>
              {STOCK_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className="field wide">
            <span>Характеристики</span>
            <input
              value={form.specsRaw}
              onChange={(e) => setForm({ ...form, specsRaw: e.target.value })}
              placeholder="Высота: 1.5 м; Длина: 10 м"
            />
          </label>
          <label className="field wide">
            <span>Описание</span>
            <textarea
              rows={5}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <label className="field wide">
            <span>Фото товара</span>
            <input type="file" accept="image/*" onChange={(e) => onFileChange(e.target.files?.[0] ?? null)} />
          </label>
        </div>

        {(preview || form.image) && (
          <img className="admin-preview" src={preview || imageUrl(form.image)} alt="Превью" />
        )}

        <div className="admin-actions">
          <button className="btn btn--accent" type="submit" disabled={loading}>
            {editingSku ? "Сохранить изменения" : "Добавить товар"}
          </button>
          {editingSku && (
            <button className="btn btn--outline" type="button" onClick={removeProduct} disabled={loading}>
              Удалить товар
            </button>
          )}
        </div>
        {status && <p className="admin-status">{status}</p>}
      </form>
    </div>
  );
}
