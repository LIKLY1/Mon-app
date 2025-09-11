// AuthPage.jsx
import React, { useState } from "react";
import { supabase } from "./supabaseClient";
import { Button } from "./App";

export default function AuthPage({ onBack, onSuccess, logoutMsg }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("signin"); // "signin" ou "signup"
  const [msg, setMsg] = useState(null);

  async function signInWithEmailPassword() {
    if (!email || !password) {
      setMsg({ type: "error", text: "Email et mot de passe requis" });
      return;
    }
    setLoading(true);
    setMsg(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
  let msgText = "Erreur de connexion";
  if (error.message.includes("Invalid login credentials")) {
    msgText = "Email ou mot de passe incorrect.";
  }
  setMsg({ type: "error", text: msgText });
} else {
  setMsg({ type: "success", text: "Connecté !" });
  onSuccess?.();
}

  }

  async function signUpWithEmail() {
    if (!email || !password) {
      setMsg({ type: "error", text: "Email et mot de passe requis" });
      return;
    }
    setLoading(true);
    setMsg(null);

    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) {
  let msgText = "Impossible de créer le compte.";
  if (error.message.includes("duplicate key")) {
    msgText = "Cet email est déjà utilisé.";
  }
  setMsg({ type: "error", text: msgText });
} else {
  setMsg({ type: "success", text: `Bienvenue ${email} 👋` });
  onSuccess?.();
}

  }

  async function signInWithDiscord() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) setMsg({ type: "error", text: error.message });
    // Pas besoin d’onSuccess ici : Supabase recharge et App.jsx détecte l’utilisateur
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
      <div className="bg-white dark:bg-zinc-800 p-8 rounded-2xl shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-6">
          {mode === "signin" ? "Connexion" : "Créer un compte"}
        </h1>

        {logoutMsg && (
  <div className="mb-4 p-3 rounded bg-blue-50 text-blue-700">
    {logoutMsg}
  </div>
)}


        {msg && (
          <div
            className={`mb-4 p-3 rounded ${
              msg.type === "error"
                ? "bg-red-50 text-red-700"
                : "bg-green-50 text-green-800"
            }`}
          >
            {msg.text}
          </div>
        )}

        <input
          type="email"
          placeholder="ton@exemple.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border px-3 py-2 mb-3"
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border px-3 py-2 mb-4"
        />

        {mode === "signin" ? (
          <Button
            onClick={signInWithEmailPassword}
            disabled={loading}
            className="w-full mb-2"
          >
            Connexion
          </Button>
        ) : (
          <Button
            onClick={signUpWithEmail}
            disabled={loading}
            className="w-full mb-2"
          >
            Créer un compte
          </Button>
        )}

        <div className="text-sm text-zinc-500 mb-4">
          {mode === "signin" ? (
            <>
              Pas encore de compte ?{" "}
              <button
                className="underline"
                onClick={() => setMode("signup")}
              >
                S'inscrire
              </button>
            </>
          ) : (
            <>
              Déjà un compte ?{" "}
              <button
                className="underline"
                onClick={() => setMode("signin")}
              >
                Se connecter
              </button>
            </>
          )}
        </div>

        <div className="border-t pt-4 mt-4">
          <Button
            onClick={signInWithDiscord}
            disabled={loading}
            className="w-full mb-4"
          >
            Se connecter avec Discord
          </Button>
        </div>

        <Button variant="outline" onClick={onBack} className="w-full">
          Retour
        </Button>
      </div>
    </div>
  );
}
