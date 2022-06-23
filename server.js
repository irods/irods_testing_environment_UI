import * as http from "http";
import express, { application } from "express";
import { readFile, writeFile } from "fs";
import cors from "cors";

const port = 3000;
import { runTest, testResParser } from "./test_helpers.mjs";
import { error } from "console";
import { stdin, stdout } from "process";
import { exec } from "child_process";
import test_history from "./test_history.json" assert { type: "json" };
import { readdirSync } from "fs";
import { json } from "stream/consumers";
const app = express();
app.use(
  cors({
    origin: "*"
  })
);

let subprocess;
let proc;
let directory;

// Standard page of API, not real usecase
app.get("/api", (req, res) => {
  res.writeHead(200);
  res.write("Home page of API");
});

// API CALL: /api/cancel
// DESCRIPTION
// Kills process of running test
// Be aware that at times, it takes a while
// Since a process will not entirely be killed
// Until every subprocess is also killed.
app.get("/api/cancel", (req, res) => {
  proc.kill();
  return res.status(200).json({ Results: "Cancelled" });
});

// API CALL: /api/getLogHistory
// DESCRIPTION
// Grabs all test results that are stored in test_history.json
// Returns a json object of the test history
app.get("/api/getLogHistory", (req, res) => {
  readFile("test_history.json", "utf-8", (err, data) => {
    res.send(JSON.parse(data));
  });
});

// API CALL: /api/setDir/:file
// DESCRIPTION
// Sets the directory variable (declared in top of file)
// To the file parameter
app.get("/api/setDir/:file", (req, res) => {
  directory = req.params.file.replace(/ForwardSlash/g, "/");
  res.send(200);
});

// API CALL: /api/getFile/:file
// DESCRIPTION
// Uses file parameter (.xml or .out extension)
// And returns contents of file
// File should always be valid paths
app.get("/api/getFile/:file", (req, res) => {
  let file = req.params.file.replace(/ForwardSlash/g, "/");
  console.log(file);
  exec("cat " + file, (error, stdout, stderr) => {
    console.log(stderr);
    console.log(stdout);
    let output = stdout;
    res.send(output);
  });
});

// API CALL: /api/getLog
// DESCRIPTION
// Uses global variable of directory
// To find paths of xml/output files
// The method uses a nested try-catch block
// The first attempts to check the directory of
// "/test-reports", which is used in core and
// Federation tests. If path fails, attempts to
// Find files that uses "junits", which is used
// In unit tests.
// Returns array of log paths, or error result.
app.get("/api/getLog", (req, res) => {
  try {
    console.log(directory);
    let dir = directory + "/logs";
    let files = readdirSync(dir);
    let xmlFiles = [];
    files.forEach((path) => {
      console.log(path);
      let tempdir = dir + "/" + path + "/test-reports";
      let servers = readdirSync(tempdir);
      servers.forEach((server) => {
        console.log(server);
        xmlFiles.push(tempdir + "/" + server);
      });
    });

    res.send({ Logs: xmlFiles });
  } catch (error) {
    try {
      console.log(directory);
      let dir = directory + "/logs";
      let files = readdirSync(dir);
      let xmlFiles = [];
      files.forEach((path) => {
        // console.log(path);
        let tempdir = dir + "/" + path + "/log";
        let servers = readdirSync(tempdir);
        servers.forEach((server) => {
          //console.log(server);
          if (server.includes("junit")) {
            xmlFiles.push(tempdir + "/" + server);
          }
        });
      });
      res.send({ Logs: xmlFiles });
    } catch (error) {
      res.send({ Error: "No test reports found" });
    }
  }
});

// API CALL: "/api/:pythonFile/:tests/:osVersion/:directory/:irodsVersion/:verbosity/:catalog/:containers/:versionOrDir"
// DESCRIPTION
// Uses all the inputs provided in the testing environment
// To run and execute the user's test(s).
// Will also write to test_history.json the test results and
// Populate the results with time, test ran, python test file, platform used, and results
// Returns results of test
app.get(
  "/api/:pythonFile/:tests/:osVersion/:directory/:irodsVersion/:verbosity/:catalog/:containers/:versionOrDir",
  (req, res) => {
    let tests = req.params.tests.split("0");
    tests.pop();

    let dir = req.params.osVersion + "/" + req.params.directory;
    let irodsVers = req.params.irodsVersion.replace(/ForwardSlash/g, "/");
    let isVersion = req.params.versionOrDir;
    if (isVersion.includes("isVersion")) {
      if (dir.includes("ubuntu-18.04") && irodsVers.includes("4.2.11"))
        irodsVers += "-1~bionic";
      else if (dir.includes("ubuntu-18.04") && irodsVers.includes("4.2.11"))
        irodsVers += "-1~xenial";
    }
    subprocess = runTest(
      req.params.pythonFile,
      tests,
      dir,
      irodsVers,
      req.params.verbosity,
      req.params.catalog,
      req.params.containers,
      req.params.versionOrDir
    );

    let testRes = "";

    console.log(typeof subprocess);

    console.log(
      subprocess.then((string) => {
        let testParam = string;
        let pending;
        console.log(testParam);
        readFile("test_history.json", "utf-8", (err, data) => {
          if (err) throw err;

          var jData = [JSON.parse(data)];
          let newj = {};
          var i = 1;
          let time = new Date().toJSON();
          console.log(jData);
          jData.forEach((entry) => {
            newj = entry;
            i += 1;
          });
          pending = time;
          let row = {
            time: time,
            pythonFile: req.params.pythonFile,
            tests: tests,
            platform: req.params.osVersion,
            database: req.params.directory,
            results: "",
            command: testParam
          };
          newj[time] = row;
          writeFile(
            "test_history.json",
            JSON.stringify(newj, null, 2),
            "utf-8",
            () => {}
          );
        });

        proc = exec(testParam, (error, stdout, stderr) => {
          console.log(stdout);
          console.log(error);
          console.log(stderr);
          let finalres = testResParser(stdout);
          readFile("test_history.json", "utf-8", (err, data) => {
            if (err) throw err;

            var jsonData = [JSON.parse(data)];
            let newjson = {};
            var i = 1;
            let time = new Date().toJSON();
            let stamp = "";
            jsonData.forEach((entry) => {
              newjson = entry;
              i += 1;
            });
            let entry = {
              time: time,
              pythonFile: req.params.pythonFile,
              tests: tests,
              platform: req.params.osVersion,
              database: req.params.directory,
              results: finalres,
              command: testParam
            };
            newjson[pending] = entry;
            console.log(entry);
            writeFile(
              "test_history.json",
              JSON.stringify(newjson, null, 2),
              "utf-8",
              () => {
                directory = finalres["Log File"];

                return res.status(200).json({ data: finalres });
              }
            );
          });
        });
      })
    );
  }
);

app.listen(port, () => {
  console.log("listening on port " + port);
});
