import Multiselect from "multiselect-react-dropdown";
import { React, useState } from "react";

// Test Results displays overall results of a test run
// Will also provide dropdown results to view XML Files
// Test Results is a component that appears in the home page
// And history page when a test is finished or view log button is clicked,
// respectively.
const TestResults = (backendData) => {
  let getLog = false;

  const [isClicked, setIsClicked] = useState(false);
  const [xmlData, setXmlData] = useState([]);
  const [xmlFile, setXmlFile] = useState();
  const [isView, setIsView] = useState(false);
  var xml = "";

  // Closes XML file that is currently open
  let closeXml = () => {
    setIsClicked(false);
  };

  // Grabs XML files of a test run
  let getXml = () => {
    let res = <div></div>;

    let getNames = () => {
      let xmljson = [];
      let delimedXml = [];
      let resFile = "";
      xmlData.forEach((file) => {
        let delimitedSlash = file.split("/");
        let delimitedDot = delimitedSlash[delimitedSlash.length - 1].split(".");
        if (delimitedDot[1] == "out") resFile = delimitedDot[0];
        else resFile = delimitedDot[2];

        delimedXml.push(resFile);
        xmljson.push({ path: file, name: resFile });
      });

      console.log(xmljson);
      return delimedXml;
    };

    if (isClicked)
      return (
        <div>
          <br />
          <br />
          <Multiselect
            isObject={false}
            onKeyPressFn={function noRefCheck() {}}
            onSearch={function noRefCheck() {}}
            singleSelect={true}
            onSelect={(item) => {
              let name = "";
              xmlData.forEach((file) => {
                if (file.includes(item[0])) {
                  name = file;
                }
              });
              let fileName = name;
              fileName = fileName.replace(/\//g, "ForwardSlash");
              fetch("/api/getFile/" + fileName).then((response) =>
                response.text().then((data) => {
                  setXmlFile(data);
                  setIsView(true);
                })
              );
            }}
            options={getNames()}
          />

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

  return (
    <div align='center'>
      <h1>{backendData.backendData["Start Test Result"]}</h1>
      <p>{backendData.backendData["Passed Tests"]}</p>
      <p>{backendData.backendData["Skipped Tests"]}</p>
      <p>{backendData.backendData["Failed Tests"]}</p>
      <p>{backendData.backendData["Return Code"]}</p>
      <p>{backendData.backendData["Time Elsapsed"]}</p>
      <h1>{backendData.backendData["End Test Result"]}</h1>
      <p>
        Log File Results Are Stored Here:
        <br />
        <br />
        {backendData.backendData["Log File"]}
      </p>
      <button
        onClick={() => {
          fetch("api/getLog").then((response) =>
            response
              .json()
              .then()
              .then((data) => {
                let output = data["Logs"];
                getLog = true;
                xml = output;
                console.log(xml);
                setIsClicked(true);
                setXmlData(output);
                getXml();
              })
          );
        }}
      >
        View Log Files
      </button>
      {isClicked && (
        <button
          onClick={() => {
            closeXml();
          }}
        >
          Close Log File
        </button>
      )}
      {isClicked && getXml()}
    </div>
  );
};

export default TestResults;
