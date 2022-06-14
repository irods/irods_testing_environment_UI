import * as http from "http";
import express, { application } from "express";
import { readFile, writeFile } from "fs";
import cors from "cors";

const port = 3000;
import { runTest, storeTests, testls, testResParser } from "./setup_ssh.mjs";
import { error } from "console";
import { stdin, stdout } from "process";
import { exec } from "child_process";
import test_history from "./test_history.json" assert { type: "json" };
import { readdirSync } from "fs";
const app = express();
app.use(
  cors({
    origin: "*"
  })
);

let subprocess;
let proc;
let directory;

app.get("/", (req, res) => {
  res.writeHead(200);
  res.write("Home page of API");
});

app.get("/api/cancel", (req, res) => {
  proc.kill();
  return res.status(200).json({ Results: "Cancelled" });
});

app.get("/api/getLogHistory", (req, res) => {
  readFile("test_history.json", "utf-8", (err, data) => {
    res.send(JSON.parse(data));
  });
});

app.get("/api/setDir/:file", (req, res) => {
  directory = req.params.file.replace(/ForwardSlash/g, "/");
  res.send(200);
});

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
        console.log(testParam);
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
              results: finalres
            };
            time = new Date().toJSON();
            newjson[time] = entry;
            console.log(entry);
            writeFile(
              "test_history.json",
              JSON.stringify(newjson, null, 2),
              "utf-8",
              () => {
                //console.log(JSON.stringify(newjson, null, 2));
                directory = finalres["Log File"];

                return res.status(200).json({ data: finalres });
              }
            );
          });
          // directory = finalres['Log File']

          // return res.status(200).json({"data": finalres})
        });
      })
    );
  }
);

app.listen(port, () => {
  console.log("listening on port " + port);
});
