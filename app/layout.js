import "./globals.css";

export const metadata = {
  title: "VentureDash Dashboard",
  description: "Modern VC & Sales Analytics Dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-50">{children}</body>
    </html>
  );
}
