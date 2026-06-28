"use client";
import "@/styles/navbar.css";
import Link from "next/link";
import Image from "next/image";
import { auth } from "../data/firebase";
import { signOut } from "firebase/auth";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

function Navbar() {
  const { user } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="navbar">
      <div className="navbar-container">
        <div className="logo-section" onClick={() => router.push("/")}>
          <Image src="/spiriting-away.png" alt="Logo" width={42} height={42} />

          <h1 className="site-title">Spiriting Away</h1>
        </div>

        <div className="nav-links">
          <Link className="nav-link" href="/">
            Explore
          </Link>
        </div>

        <div className="nav-user">
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
            <Link className="nav-signin" href="/auth">
              Sign In
            </Link>
          )}
        </div>

        {isOpen ? (
          <X
            size={20}
            className="hamburger"
            onClick={() => {
              setMenuOpen(false);
              setIsOpen(false);
            }}
          />
        ) : (
          <Menu
            size={20}
            className="hamburger"
            onClick={() => {
              setMenuOpen(true);
              setIsOpen(true);
            }}
          />
        )}
      </div>

      {menuOpen && (
        <div className="mobile-menu">
          {user ? (
            <div className="hamburger-links">
              <span className="nav-username">
                {user.displayName || user.email}
              </span>

              <span
                className="nav-signout"
                onClick={() => {
                  signOut(auth);
                  setMenuOpen(false);
                }}
              >
                Sign out
              </span>
            </div>
          ) : (
            <Link href="/auth" onClick={() => setMenuOpen(false)}>
              Sign In
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default Navbar;
