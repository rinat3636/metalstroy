import { useEffect, useState } from "react";
import SearchCombobox from "./SearchCombobox";

export default function HeaderSearch() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState("");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setInitialQuery(q);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const input = document.querySelector<HTMLInputElement>(".header-search input");
    input?.focus();
  }, [mobileOpen]);

  return (
    <>
      <SearchCombobox
        variant="header"
        mode="navigate"
        initialQuery={initialQuery}
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
      />
      <button
        className="search-toggle"
        type="button"
        aria-label="Поиск"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((open) => !open)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
      </button>
    </>
  );
}
