import fs from "fs";
import jwt from "jsonwebtoken";

const PRIVATE_KEY = fs.readFileSync("AuthKey_X5R77Y7JY2.p8");

console.log(PRIVATE_KEY)

const TEAM_ID = "YYW69L3H994";
const CLIENT_ID = "com.ryan.fifteen.services";
const KEY_ID = "X5R77Y7JY2";

const token = jwt.sign(
  {
    iss: TEAM_ID,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 15777000, // 6 months
    aud: "https://appleid.apple.com",
    sub: CLIENT_ID,
  },
  PRIVATE_KEY,
  {
    algorithm: "ES256",
    keyid: KEY_ID,
  }
);

console.log(token);
