module.exports = () => [
  {
    "path": "/backend/services/(.*)",
    "proxy": {
      "instance": "services:3500",
      "path": "/v1.0/invoke/services/method/$1"
    }
  }
];
