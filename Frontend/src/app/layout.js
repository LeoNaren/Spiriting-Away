import "./globals.css";
import Navbar from "../components/Navbar";
import { Providers } from "./providers";

export const metadata = {
  title: "Spiriting Away",
  description: "Aham Brahmasmi.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}