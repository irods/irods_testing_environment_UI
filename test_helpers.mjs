import { existsSync, readFile, writeFile } from "node:fs";
import { exec, execSync, spawnSync } from "node:child_process";
import { raw } from "express";

let proc;
const dir = "./irods_testing_environment";

// Will Create the string to execute the run test
export async function runTest(
  pythonFile,
  tests,
  directory,
  irodsVersion,
  verbosity,
  catalog,
  containers,
  versionOrDir
) {
  // If the testing environment is not present in the directory
  // It will clone the repo inorder to install and allow for test runs
  // Note: not having the testing environment in your directory will have
  // a slightly longer test run than if it was cloned prior to running tests
  if (!existsSync(dir)) {
    execSync(
      "git clone https://github.com/alanking/irods_testing_environment.git",
      (error, stdout, stderr) => {
        if (error) {
          console.log(`error ${error}`);
        }
      }
    );
  }

  // The setup command sets up the virtual environment
  const setupCommand =
    "pip3 install virtualenv;" +
    "virtualenv -p python3 /tmp/venv;" +
    "source /tmp/venv/bin/activate;" +
    "python -m pip install --upgrade pip;" +
    "pip install docker-compose;" +
    "pip install GitPython;" +
    "cd irods_testing_environment;";

  let testsExec = "";
  tests.forEach((test) => {
    testsExec += test + " ";
  });
  const pythonRunFile = "python " + pythonFile + " ";
  if (testsExec != "none ") testsExec = "--tests " + testsExec;
  const projectDir = "--project-dir=projects/" + directory + "/ ";
  let irodsVers = "--irods-package-version=" + irodsVersion + " ";
  if (versionOrDir == "isDir")
    irodsVers = "--irods-package-directory=" + irodsVersion + " ";
  const setContainers = "--concurrent-test-executor-count=" + containers + " ";
  let testCommand = pythonRunFile;
  if (testsExec === "none ") testCommand += projectDir + verbosity + ";";
  else if (pythonRunFile.includes("topology"))
    testCommand +=
      catalog +
      " " +
      testsExec +
      projectDir +
      setContainers +
      irodsVers +
      verbosity +
      ";";
  else
    testCommand +=
      testsExec + projectDir + setContainers + irodsVers + verbosity + ";";

  // Concatenates the setup command and test command to send back to server to execute test
  return setupCommand + testCommand;
}

// Parses the test results to server
// Results are then displayed on page and stored in test_history.json
export function testResParser(rawRes) {
  let beg = "==== begin test run results ====\n";
  let end = "==== end of test run results ====\n";

  let begPos = rawRes.indexOf(beg);
  let endPos = rawRes.indexOf(end) + end.length - 1;
  let logBeg = "collecting logs ";
  let logBegPos = rawRes.indexOf(logBeg);

  let rawResEnd = rawRes.substring(logBegPos + logBeg.length + 1);
  let logEndPos = rawResEnd.indexOf("]");
  let logFile = rawResEnd.substring(0, logEndPos);

  let testStr = rawRes.substring(begPos, endPos);

  let passedPos = testStr.indexOf("passed tests:");
  let skippedPos = testStr.indexOf("skipped tests:");
  let failedPos = testStr.indexOf("failed tests:");
  let retCodePos = testStr.indexOf("return code:");
  let timePos = testStr.indexOf("time elapsed:");
  let res = {
    "Start Test Result": beg,
    "Passed Tests": testStr.substring(passedPos, skippedPos),
    "Skipped Tests": testStr.substring(skippedPos, failedPos),
    "Failed Tests": testStr.substring(failedPos, retCodePos),
    "Return Code": testStr.substring(retCodePos, timePos),
    "Time Elapsed": testStr.substring(timePos, testStr.indexOf(":)")),
    "End Test Result": end,
    "Log File": logFile
  };

  return res;
}
