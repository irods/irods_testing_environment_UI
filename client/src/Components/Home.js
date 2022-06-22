import React, { useState } from "react";
import TestResults from "./TestResults";
import Multiselect from "multiselect-react-dropdown";
import core_test_list from "./core_test_list.json";
import unit_test_list from "./unit_test_list.json";
import plugins_list from "./plugins_list.json";
import project_directory_list from "./project_directory_list.json";
import { Spinner } from "react-bootstrap";
import irods_version from "./irods_version.json";
import python_test_files from "./python_test_files.json";
import NumericInput from "react-numeric-input";
import Table from "./Table";
import { Link, useParams } from "react-router-dom";

// Home page of application
// Allows user to configure and run a test run
// Results will appear once a test is ran
// User can also go to history page and test will
// Continue to run
function Home() {
  // If rerunning test, grabs any parameters that are available
  let { pythonFile, tests, platform, database, verb, conts, flag, vers } =
    useParams();
  try {
    vers = vers.replace(/ForwardSlash/g, "/");
  } catch (error) {}

  // Initializes all the states for configuration
  const [backendData, setBackendData] = useState({
    "Start Test Result": "",
    "Passed Tests": "",
    "Skipped Tests": "",
    "Failed Tests": "",
    "Return Code": "",
    "Time Elapsed": "",
    "End Test Result": ""
  });
  const [isLoading, setLoading] = useState(true);
  const [isClicked, setClick] = useState(false);
  const [pythonTest, setPythonTest] = useState(pythonFile);
  const [selectedTestOptions, setSelectedTestOptions] = useState(() => {
    if (tests) return tests.split(",");
    else return [];
  });
  let isTopology = false;
  let provideConcurrencyOption = false;
  const [topologyOption, setTopologyOption] = useState("undefined");
  const [projectDirectory, setProjectDirectory] = useState(() => {
    if (platform != undefined) return platform + "\\" + database;
    return "";
  });

  const [irodsVersion, setIrodsVersion] = useState(() => {
    if (flag == "--irods-package-version") return vers;
    else return "4.2.11";
  });
  const [verbosity, setVerbosity] = useState(verb);
  const [isCancel, setIsCancel] = useState(false);
  const [containers, setContainers] = useState(() => {
    if (conts) return conts;
    else return 1;
  });
  const [testHistory, setTestHistory] = useState({});
  const [isVersion, setIsVersion] = useState(() => {
    if (flag == "--irods-package-version") return true;

    return false;
  });
  const [isDir, setIsDir] = useState(() => {
    if (flag == "--irods-package-directory") return true;

    return false;
  });
  const [packageDir, setPackageDir] = useState(() => {
    if (flag == "--irods-package-directory") return vers;

    return false;
  });

  // Completes fetch request for running test
  // Populates results
  // Prints result onto screen
  async function getResults(string) {
    const res = await fetch(string, {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    });
    const json = await res.json().then((data) => {
      let res = data.data;
      setBackendData(res);
      console.log(res);
      setLoading(false);
      setClick(false);
      screenRes();
    });
  }

  // Prints results onto screen using Test Result Component
  let screenRes = () => {
    if (!isLoading && backendData["Return Code"] !== "") {
      return <TestResults backendData={backendData} />;
    }
  };

  // Gets concurrency input depending on which python file is selected
  let getConcurrency = () => {
    if (provideConcurrencyOption) {
      return (
        <div
          style={{ width: "35%", display: "inline-block", marginLeft: "10%" }}
        >
          <br />
          Concurrent Containers
          <br />
          <NumericInput
            min={1}
            placeholder={containers}
            onChange={(num) => setContainers(num)}
            style={{ width: "35%", display: "inline-block", marginLeft: "10%" }}
          />
          <br />
          <br />
        </div>
      );
    }
  };

  // Returns a catalog service drop down if a Topology test is selected
  let getTopology = () => {
    if (isTopology)
      return (
        <div
          style={{ width: "35%", display: "inline-block", marginLeft: "10%" }}
        >
          <br />
          Catalog Service
          <Multiselect
            isObject={false}
            singleSelect={true}
            onKeyPressFn={function noRefCheck() {}}
            onRemove={function noRefCheck() {}}
            onSearch={function noRefCheck() {}}
            onSelect={(item) => {
              setTopologyOption(item);
            }}
            options={["provider", "consumer"]}
          />
          <br />
        </div>
      );
  };

  // Grabs the test collection depending on which python file is selected
  let getTestCollections = () => {
    let testCollection = [];
    switch (pythonTest) {
      case "run_unit_tests.py":
        testCollection = unit_test_list;
        provideConcurrencyOption = true;
        break;
      case "run_core_tests.py":
        testCollection = core_test_list;
        provideConcurrencyOption = true;
        break;
      case "run_topology_tests.py":
        testCollection = core_test_list;
        isTopology = true;
        break;
      case "run_federation_tests.py":
        testCollection = [];
        break;
      case "run_plugin_tests.py":
        testCollection = plugins_list;
        break;
      default:
        testCollection = [];
        break;
    }
    return testCollection;
  };

  // Cancels a test you ran
  let getCancel = () => {
    if (isCancel) return <div>Cancelling Testings...</div>;
  };

  return (
    <div>
      <div>
        <h1 align='center'>iRODS Testing Environment</h1>
        <div
          style={{
            width: "35%",
            display: "inline-block",
            marginLeft: "10%",
            marginTop: "5%"
          }}
        >
          Python Test File
          <Multiselect
            isObject={false}
            selectedValues={[pythonTest]}
            onKeyPressFn={function noRefCheck() {}}
            singleSelect={true}
            onRemove={(item) => {
              setSelectedTestOptions(item);
            }}
            onSearch={function noRefCheck() {}}
            onSelect={(item) => {
              setPythonTest(item[0]);
            }}
            options={python_test_files}
          />
        </div>
        <div
          style={{ width: "35%", display: "inline-block", marginLeft: "10%" }}
        >
          Test Names
          <Multiselect
            isObject={false}
            onKeyPressFn={function noRefCheck() {}}
            selectedValues={selectedTestOptions}
            onRemove={(item) => {
              setSelectedTestOptions(item);
            }}
            onSearch={function noRefCheck() {}}
            onSelect={(item) => {
              setSelectedTestOptions(item);
            }}
            options={getTestCollections()}
          />
        </div>
      </div>

      {getTopology()}
      {getConcurrency()}
      <br />

      <div>
        <div
          style={{ width: "35%", display: "inline-block", marginLeft: "10%" }}
        >
          Project Directory
          <Multiselect
            isObject={false}
            selectedValues={[projectDirectory]}
            onKeyPressFn={function noRefCheck() {}}
            onSearch={function noRefCheck() {}}
            singleSelect={true}
            onSelect={(item) => {
              setProjectDirectory(item[0]);
            }}
            options={project_directory_list}
          />
        </div>
        <div
          style={{ width: "35%", display: "inline-block", marginLeft: "10%" }}
        >
          Select Flag
          <Multiselect
            placeholder={flag}
            isObject={false}
            onKeyPressFn={function noRefCheck() {}}
            onSearch={function noRefCheck() {}}
            singleSelect={true}
            onSelect={(item) => {
              if (item == "--irods-package-version") {
                setIsVersion(true);
                setIsDir(false);
              } else {
                setIsDir(true);
                setIsVersion(false);
              }
            }}
            options={["--irods-package-directory", "--irods-package-version"]}
          />
        </div>
        <div
          style={{ width: "35%", display: "inline-block", marginLeft: "10%" }}
        >
          <br />
          Verbosity:
          <Multiselect
            isObject={false}
            selectedValues={[verbosity]}
            onKeyPressFn={function noRefCheck() {}}
            onSearch={function noRefCheck() {}}
            singleSelect={true}
            onSelect={(item) => {
              setVerbosity(item[0]);
            }}
            options={["-v", "-vv", "-vvv"]}
          />
        </div>
        {isDir && (
          <div
            style={{
              display: "inline-block",
              marginLeft: "10%"
            }}
          >
            iRODS Package Directory
            <br />
            <input
              size='67'
              placeholder={packageDir}
              onChange={(e) => {
                setPackageDir(e.target.value);
              }}
            ></input>
          </div>
        )}
        {isVersion && (
          <div
            style={{
              width: "35%",
              display: "inline-block",
              marginLeft: "10%"
            }}
          >
            iRODS Version
            <Multiselect
              placeholder={irodsVersion}
              isObject={false}
              onKeyPressFn={function noRefCheck() {}}
              onSearch={function noRefCheck() {}}
              singleSelect={true}
              onSelect={(item) => {
                setIrodsVersion(item);
              }}
              options={irods_version}
            />
          </div>
        )}
      </div>

      <div align='center'>
        <button
          style={{
            width: "50%",
            paddingLeft: "20%",
            paddingRight: "20%",
            marginTop: "2%",
            height: "10%"
          }}
          onClick={() => {
            setClick(true);
            let tests = "";
            for (let i = 0; i < selectedTestOptions.length; i++)
              tests += selectedTestOptions[i] + "0";
            if (tests == 0) tests = "none0";
            if (isVersion) {
              getResults(
                "/api/" +
                  pythonTest +
                  "/" +
                  tests +
                  "/" +
                  projectDirectory +
                  "/" +
                  irodsVersion +
                  "/" +
                  verbosity +
                  "/" +
                  topologyOption +
                  "/" +
                  containers +
                  "/isVersion"
              );
            } else if (isDir) {
              getResults(
                "/api/" +
                  pythonTest +
                  "/" +
                  tests +
                  "/" +
                  projectDirectory +
                  "/" +
                  packageDir.replace(/\//g, "ForwardSlash") +
                  "/" +
                  verbosity +
                  "/" +
                  topologyOption +
                  "/" +
                  containers +
                  "/isDir"
              );
            }
          }}
        >
          Run Test
        </button>
        {isClicked && (
          <Spinner animation='border' align='center'>
            <span className='visually-hidden'>Running Tests...</span>
          </Spinner>
        )}
        <br />

        {isClicked && (
          <div>
            <button
              onClick={() => {
                setIsCancel(true);
                fetch("/api/cancel").then((response) =>
                  response
                    .json()
                    .then((data) => {
                      console.log(data);
                    })
                    .then(setIsCancel(false))
                );
              }}
            >
              Cancel Tests
            </button>
            {isCancel && getCancel()}
          </div>
        )}
      </div>
      {screenRes()}
      <br />
      <br />
      <div align='center'>
        <Link
          to='/history'
          component={
            <Table
              rows={() => {
                fetch("/api/getLogHistory").then((response) =>
                  response.json().then((data) => {
                    setTestHistory(data);
                    console.log(data);
                  })
                );

                return setTimeout(testHistory, 5000);
              }}
            />
          }
        >
          Test History
        </Link>
      </div>
    </div>
  );
}

export default Home;
