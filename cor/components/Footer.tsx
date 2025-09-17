
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white mt-8 py-4 no-print">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} Corporate Financial Dashboard. All rights reserved.</p>
        <p className="mt-1">(주)지니스</p>
      </div>
    </footer>
  );
};

export default Footer;