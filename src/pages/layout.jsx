import Sidebar from "@/components/Sidebar";
import React from "react";

export default function RootLayout({ children }) {
  return (
    <div className="flex">
      <div className="basis-2/12 z-[80]">
        <Sidebar />
      </div>
      <div className="basis-10/12 overflow-hidden">{children}</div>
    </div>
  );
}
