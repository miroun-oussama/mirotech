import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, ExternalLink, Loader2, LogOut, RefreshCw, Search } from "lucide-react";
import { money } from "../lib/format";
import { fetchOrders, logoutOrders, ordersEnabled, toWhatsappNumber, updateOrderStatus } from "../lib/orders";
import { usePageMeta } from "../lib/usePageMeta";
import WhatsAppIcon from "../components/WhatsAppIcon";

// On ne garde que le jeton de session (30 min) délivré par Google, jamais le mot de passe.
const STORAGE_KEY = "mirotech-admin-token";
const ORDER_STATUSES = ["Nouvelle", "Confirmée", "Livrée", "Annulée"];

const readSaved = () => {
  try {
    return sessionStorage.getItem(STORAGE_KEY) || "";
  } catch {
    return "";
  }
};
const save = (value) => {
  try {
    if (value) sessionStorage.setItem(STORAGE_KEY, value);
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* stockage indisponible : la session reste en mémoire */
  }
};

const statusClass = (status) => {
  const s = String(status || "").toLowerCase();
  if (s.startsWith("nouv")) return "new";
  if (s.startsWith("conf")) return "confirmed";
  if (s.startsWith("livr")) return "delivered";
  if (s.startsWith("annul")) return "cancelled";
  return "other";
};

export default function Admin() {
  usePageMeta({ title: "Administration — MIROTECH", robots: "noindex, nofollow" });
  const [token, setToken] = useState(readSaved);
  const [data, setData] = useState(null); // { orders, sheetUrl }
  const [loading, setLoading] = useState(false);
  const [savingOrder, setSavingOrder] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showPassword, setShowPassword] = useState(false);

  const load = useCallback(async (credentials) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchOrders(credentials);
      const sheetUrl = String(res.sheetUrl || "").startsWith("https://docs.google.com/") ? res.sheetUrl : "";
      setData({ orders: res.orders ?? [], sheetUrl });
      setToken(res.token || "");
      save(res.token || "");
    } catch (err) {
      setData(null);
      setToken("");
      save("");
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Session ouverte dans l'onglet : on recharge directement après un rafraîchissement.
  useEffect(() => {
    const saved = readSaved();
    if (saved && ordersEnabled()) load({ token: saved });
  }, [load]);

  const logout = () => {
    logoutOrders(token);
    setData(null);
    setToken("");
    save("");
  };

  const changeStatus = async (order, status) => {
    setSavingOrder(order.row);
    setError("");
    try {
      const result = await updateOrderStatus(token, order, status);
      setData((current) => current && ({
        ...current,
        orders: current.orders.map((item) => item.id === order.id && item.row === order.row
          ? { ...item, row: result.row ?? item.row, status: result.status }
          : item),
      }));
    } catch (err) {
      setError(err.message === "Action inconnue."
        ? "Publiez la version mise à jour de Code.gs pour modifier les statuts."
        : err.message);
    } finally {
      setSavingOrder(null);
    }
  };

  const orders = data?.orders ?? [];
  const statuses = useMemo(() => [...new Set(orders.map((o) => o.status).filter(Boolean))], [orders]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (!q) return true;
      return [o.id, o.name, o.phone, o.address, o.items].some((v) => String(v).toLowerCase().includes(q));
    });
  }, [orders, query, statusFilter]);
  const revenue = useMemo(
    () => orders.filter((o) => statusClass(o.status) !== "cancelled").reduce((n, o) => n + (Number(o.total) || 0), 0),
    [orders],
  );

  if (!ordersEnabled()) {
    return (
      <div className="section admin-page">
        <p className="eyebrow">ADMINISTRATION</p>
        <h1>Commandes</h1>
        <p className="admin-note">
          La connexion à Google Sheets n'est pas configurée. Suivez <code>google-apps-script/INSTALLATION.md</code> puis
          ajoutez <code>VITE_ORDERS_API_URL</code>.
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="section admin-page">
        <form
          className="admin-login"
          onSubmit={(e) => {
            e.preventDefault();
            const pw = new FormData(e.currentTarget).get("password");
            if (pw) load({ password: String(pw) });
          }}
        >
          <p className="eyebrow">ADMINISTRATION</p>
          <h1>Connexion</h1>
          <div className="password-field">
            <label htmlFor="admin-password">Mot de passe</label>
            <div className="password-input">
              <input id="admin-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required autoFocus disabled={loading} />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                aria-pressed={showPassword}
                disabled={loading}
              >
                {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
          </div>
          <button className="button button-primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="spin" aria-hidden="true" /> Vérification…
              </>
            ) : (
              "Se connecter"
            )}
          </button>
          {error && (
            <p className="form-status form-error" role="alert">
              {error}
            </p>
          )}
        </form>
      </div>
    );
  }

  return (
    <div className="section admin-page">
      <div className="admin-head">
        <div>
          <p className="eyebrow">ADMINISTRATION</p>
          <h1>Commandes</h1>
        </div>
        <div className="admin-actions">
          <button className="button button-outline" onClick={() => load({ token })} disabled={loading || savingOrder !== null}>
            <RefreshCw size={15} className={loading ? "spin" : ""} aria-hidden="true" /> Actualiser
          </button>
          {data.sheetUrl && (
            <a className="button button-outline" href={data.sheetUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={15} aria-hidden="true" /> Google Sheet
            </a>
          )}
          <button className="button button-outline" onClick={logout} disabled={loading || savingOrder !== null}>
            <LogOut size={15} aria-hidden="true" /> Déconnexion
          </button>
        </div>
      </div>

      {error && (
        <p className="form-status form-error" role="alert">
          {error}
        </p>
      )}

      <div className="admin-stats">
        <div>
          <span>Commandes</span>
          <strong>{orders.length}</strong>
        </div>
        <div>
          <span>Chiffre d'affaires (hors annulées)</span>
          <strong>{money(revenue)}</strong>
        </div>
        <div>
          <span>Nouvelles</span>
          <strong>{orders.filter((o) => statusClass(o.status) === "new").length}</strong>
        </div>
      </div>

      <div className="admin-filters">
        <label className="admin-search">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            placeholder="Rechercher (nom, téléphone, n° de commande…)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Rechercher une commande"
          />
        </label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filtrer par statut">
          <option value="all">Tous les statuts</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {visible.length === 0 ? (
        <p className="admin-note">{orders.length ? "Aucune commande ne correspond." : "Aucune commande pour le moment."}</p>
      ) : (
        <div className="order-list">
          {visible.map((o) => (
            <article className="order-card" key={`${o.row}-${o.id}`}>
              <header>
                <div>
                  <strong>{o.id}</strong>
                  <span>{o.date}</span>
                </div>
                <div
                  className="order-status"
                  role="group"
                  aria-label={`Statut de la commande ${o.id}`}
                  aria-busy={savingOrder === o.row}
                >
                  {!ORDER_STATUSES.includes(o.status) && <span>{o.status || "Sans statut"}</span>}
                  {ORDER_STATUSES.map((status) => (
                    <button
                      key={status}
                      type="button"
                      className={`status status-${statusClass(status)}`}
                      aria-pressed={o.status === status}
                      disabled={loading || savingOrder !== null}
                      onClick={() => {
                        if (o.status !== status) changeStatus(o, status);
                      }}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </header>
              <div className="order-body">
                <div>
                  <h2>{o.name}</h2>
                  <a href={`tel:${String(o.phone ?? "").replace(/[^+\d]/g, "")}`}>{o.phone}</a>
                  <p>{o.address}</p>
                </div>
                <ul>
                  {String(o.items)
                    .split("\n")
                    .filter(Boolean)
                    .map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                </ul>
                <div className="order-total">
                  <strong>{money(o.total)}</strong>
                  <small>{o.payment}</small>
                  <a
                    className="button button-primary"
                    href={`https://wa.me/${toWhatsappNumber(o.phone)}?text=${encodeURIComponent(
                      `Bonjour ${o.name}, c'est MIROTECH au sujet de votre commande ${o.id}.`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <WhatsAppIcon size={15} /> Contacter
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
