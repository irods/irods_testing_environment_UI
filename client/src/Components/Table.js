import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import TestResults from "./TestResults";
import { Link, Navigate, useNavigate } from "react-router-dom";
import ColoredCircle from "./ColoredCircle";

// Table component is what is rendered for history page
// Displays test_history.json
// Can also send parameters to home page to rerun test
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
  const [rerun, setRerun] = useState("");
  const [isRerun, setIsRerun] = useState(false);

  // Loads log history when page is loading
  useEffect(() => {
    fetch("/api/getLogHistory").then((response) =>
      response.json().then((data) => {
        setTestHistory(data);
      })
    );
  }, []);

  // Grabs xmls files. Same functionality as located in TestResults.js
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

  // Rerouting to home page and populate states to rerun tests
  let navigate = useNavigate();
  const routeChange = (pythonFile, tests, platform, database, command) => {
    let testCommand = command.split(";");
    testCommand = testCommand[testCommand.length - 2].split(" ");
    let verbosity = testCommand[testCommand.length - 1];
    let containers;
    let irods;
    console.log(testCommand);
    testCommand.forEach((arg) => {
      if (arg.includes("--concurrent-test-executor-count=")) containers = arg;
      if (
        arg.includes("--irods-package-version=") ||
        arg.includes("--irods-package-directory=")
      )
        irods = arg;
    });
    irods = irods.split("=");
    let flag = irods[0];
    let version = irods[1].split("-")[0];
    version = version.replace("/", "ForwardSlash");
    containers = containers.substring(containers.indexOf("=") + 1);
    let path =
      `/home/` +
      pythonFile +
      "/" +
      tests +
      "/" +
      platform +
      "/" +
      database +
      "/" +
      containers +
      "/" +
      flag +
      "/" +
      version +
      "/" +
      verbosity;
    navigate(path);
  };

  // Configures columns
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
        let raw;
        try {
          raw = row.results["Passed Tests"].replace("passed tests:", "");
        } catch (err) {
          return <ColoredCircle color='yellow' />;
        }
        row.tests.forEach((test) => {
          if (raw.includes(test)) count++;
        });
        if (count == length) return <ColoredCircle color='green' />;
        else if (row.results == "") return <ColoredCircle color='yellow' />;
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

            return <TestResults backendData={row.database} />;
          }}
        >
          View Logs
        </button>
      )
    },
    {
      name: "",
      selector: (row) => {
        return (
          <button
            onClick={() => {
              routeChange(
                row.pythonFile,
                row.tests,
                row.platform,
                row.database,
                row.command
              );
            }}
          >
            Rerun
          </button>
        );
      },
      sortable: false
    }
  ];

  return (
    <div align='center'>
      <br />
      <div align='center'>
        <Link to='/home'>Back to testing environment</Link>
      </div>
      <br />

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
