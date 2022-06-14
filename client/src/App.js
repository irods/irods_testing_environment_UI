import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Home from "./Components/Home";
import Table from "./Components/Table";

export default function App() {
  const [testHistory, setTestHistory] = useState();

  return (
    <div>
      <nav
        style={{
          borderBottom: "solid 1px",
          paddingBottom: "1rem"
        }}
      >
        <BrowserRouter>
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='home' element={<Home />} />
            <Route path='history' element={<Table />} />
          </Routes>
        </BrowserRouter>
      </nav>
    </div>
  );
}
