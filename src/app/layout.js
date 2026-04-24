import './globals.css';

export const metadata = {
  title: 'Bajaj Finserv Internship Task(Manish)',
  description: 'SRM Full Stack Engineering Challenge Round 1',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
