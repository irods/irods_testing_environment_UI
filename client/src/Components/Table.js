import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import TestResults from "./TestResults";
import { Link } from "react-router-dom";
import ColoredCircle from "./ColoredCircle";

const Table = ({}) => {
  const [isClicked, setIsClicked] = useState(false);
  const [log, setLog] = useState();
  let logDir = "";
  const [xmlData, setXmlData] = useState([]);
  const [xmlFile, setXmlFile] = useState();
  const [isView, setIsView] = useState(false);
  const [row, setRow] = useState();
  const [testHistory, setTestHistory] = useState({});
  const [isHistoryClicked, setIsHistoryClicked] = useState(false);
  const [isViewReport, setIsViewReport] = useState(false);
  const [isError, setIsError] = useState(false);
  const [data, setData] = useState();

  useEffect(() => {
    fetch("/api/getLogHistory").then((response) =>
      response.json().then((data) => {
        setTestHistory(data);
      })
    );
  }, []);

  // if (rows) {
  //   setRow(row);
  // } else {
  //   fetch("/api/getLogHistory").then((response) =>
  //     response.json().then((data) => {
  //       setRow(data);
  //       console.log(row);
  //     })
  //   );
  // }

  let getXml = () => {
    let res = <div></div>;

    if (isViewReport)
      return (
        <div>
          <br />
          <br />
          {xmlData.map((file) => {
            let name = file.split("/");
            name = name[name.length - 1];
            name = name.split(".");
            console.log(name);
            if (name[1] == "out") name = name[0];
            else name = name[2];
            return (
              <div>
                <button
                  onClick={() => {
                    //console.log(file)
                    let fileName = file.replace(/\//g, "ForwardSlash");
                    //console.log(fileName)
                    fetch("/api/getFile/" + fileName).then((response) =>
                      response.text().then((data) => {
                        setXmlFile(data);
                        setIsView(true);
                        console.log(xmlData);
                      })
                    );
                  }}
                >
                  {name} Results
                </button>
              </div>
            );
          })}
          {isView && (
            <div>
              {" "}
              <button onClick={() => setIsView(false)}>Close</button>{" "}
            </div>
          )}
          {isView && (
            <div>
              <pre lang='xml'>{xmlFile}</pre>
            </div>
          )}
        </div>
      );
  };

  const columns = [
    {
      name: "Time",
      selector: (row) => row.time,
      sortable: true
    },
    {
      name: "Python File",
      selector: (row) => row.pythonFile,
      sortable: false
    },
    {
      name: "Tests",
      selector: (row) => {
        let display = "";
        row.tests.forEach((element) => {
          display += element + " ";
        });
        return display;
      },
      sortable: false
    },
    {
      name: "Platform",
      selector: (row) => row.database,
      sortable: false
    },
    {
      name: "Status",
      selector: (row) => {
        let length = row.tests.length;
        let count = 0;
        let raw = row.results["Passed Tests"].replace("passed tests:", "");
        row.tests.forEach((test) => {
          if (raw.includes(test)) count++;
        });
        if (count == length) return <ColoredCircle color='green' />;
        else return <ColoredCircle color='red' />;
      },
      sortable: false
    },
    {
      name: "Log files",
      button: true,
      cell: (row) => (
        <button
          onClick={() => {
            setIsClicked(false);
            setLog(row.results["Log File"]);
            logDir = row.results["Log File"];
            setIsClicked(true);
            setRow(row.results);
            //useEffect(() => {});
            // setTimeout(() => {
            fetch(
              "/api/setDir/" + logDir.replace(/\//g, "ForwardSlash")
            ).then();
            // fetch("api/getLog").then((response) =>
            //   response
            //     .json()
            //     .then()
            //     .then(
            //       //xmlString => $.parseXML(xmlString)).then
            //       //(
            //       (data) => {
            //         console.log(row.results["Log File"]);
            //         let output = data["Logs"];
            //         //getLog = true;
            //         // xml = output;
            //         //console.log(xml);
            //         setIsClicked(true);
            //         setXmlData(output);
            //         getXml();
            //         console.log(output);

            //         //console.log(xml)
            //       }
            //     )
            // )
            // }, 5000);

            //file.replace(/\//g, "ForwardSlash");
            // console.log(log);
            return <TestResults backendData={row.results} />;
          }}
        >
          View Logs
        </button>
      )
    }
  ];

  //console.log(Object.values(rows));
  return (
    <div align='center'>
      <br />
      <div align='center'>
        <Link to='/home'>Back to testing environment</Link>
      </div>
      <br />
      {/* {isHistoryClicked && (

      )} */}
      <DataTable
        columns={columns}
        data={Object.values(testHistory)}
        pagination
      />
      {isClicked && (
        <div>
          <TestResults backendData={row} />
        </div>
      )}

      {/* {isClicked && (
        <div>
          <br />
          <button
            onClick={() => {
              fetch("api/getLog").then((response) =>
                response.json().then(
                  //xmlString => $.parseXML(xmlString)).then
                  //(
                  (data) => {
                    //console.log(row.results["Log File"]);
                    let output;
                    if (data["Logs"]) {
                      output = data["Logs"];
                      //getLog = true;
                      // xml = output;
                      //console.log(xml);

                      setIsViewReport(true);
                      setIsError(false);
                      setXmlData(output);
                      getXml();
                      // console.log(output);
                    } else {
                      setIsError(true);
                      setIsViewReport(false);
                      setXmlFile(data["Error"]);
                    }
                    // let output = data["Logs"];
                    // //getLog = true;
                    // // xml = output;
                    // //console.log(xml);

                    // setIsViewReport(true);
                    // setXmlData(output);
                    // getXml();
                    // console.log(output);

                    //console.log(xml)
                  }
                )
              );
            }}
          >
            View reports
          </button>
        </div>
      )} */}

      {isViewReport && getXml()}
      <br />
      {isError && (
        <div>
          No XML logs found :{"("} <br /> Try a different test{" "}
        </div>
      )}
      <br />
      {isError && (
        <div>
          <button onClick={() => setIsError(false)}>Clear</button>
        </div>
      )}

      {isClicked && (
        <div>
          <button onClick={() => setIsClicked(false)}>Close Results</button>
        </div>
      )}
    </div>
  );
};

export default Table;
