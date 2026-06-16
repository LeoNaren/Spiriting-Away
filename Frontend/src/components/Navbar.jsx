"use client";
import Link from "next/link";
import Image from "next/image";
import { auth } from "../data/firebase";
import { signOut } from "firebase/auth";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

function Navbar() {
  const { user } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="navbar">
      <Image className="navbar-logo" src="/spiriting-away.png" alt="Logo" height={50} width={50} />

      <h1
        className="navbar-title"
        onClick={() => router.push("/")}
        style={{ cursor: "pointer" }}
      >
        Spiriting Away
      </h1>

      <div className="nav-links">
        {user ? (
          <>
            <span className="nav-username">
              {user.displayName || user.email}
            </span>
            <span className="nav-signout" onClick={() => signOut(auth)}>
              Sign out
            </span>
          </>
        ) : (
          <Link href="/auth">Sign In</Link>
        )}
      </div>

      <button className={`hamburger ${menuOpen ? "active" : ""}`} onClick={() => setMenuOpen(!menuOpen)}>
        <span /><span /><span />
      </button>

      {menuOpen && (
        <div className="mobile-menu">
          {user ? (
            <>
            <span className="nav-username">{user.displayName || user.email}</span>
            <span className="nav-signout" onClick={() => { signOut(auth); setMenuOpen(false); }}>
              Sign out</span>
            </>
          ) : (<Link href="/auth" onClick={() => setMenuOpen(false)}>Sign In</Link>
          )}
        </div>
      )}
    </div>
  );
}

export default Navbar;
