import { useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Home from "./Components/Home";
import Table from "./Components/Table";

export default function App() {
  const [testHistory, setTestHistory] = useState();

  let getHistory = () => {
    fetch("/api/getLogHistory").then((response) =>
      response.json().then((data) => {
        setTestHistory(data);
        console.log(testHistory);
      })
    );
  };

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
            <Route
              path='history'
              element={
                <Table
                  stuff={() => {
                    fetch("/api/getLogHistory").then((response) =>
                      response.json().then((data) => {
                        setTestHistory(data);
                        // console.log(testHistory);
                      })
                    );

                    return testHistory;
                  }}
                />
              }
            />
          </Routes>
        </BrowserRouter>
      </nav>
    </div>
  );
}
