const express = require("express");
const cors = require("cors");
const employeeRoutes = require("./Routes/employeeRoutes");

const app = express();

app.use(express.json());

app.use(cors());

app.use(employeeRoutes);

app.listen(8082, () => {
    console.log(`Server is running on port 8082`);
});