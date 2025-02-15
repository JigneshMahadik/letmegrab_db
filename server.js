const express = require("express");
const employeeRoutes = require("./Routes/employeeRoutes");

const app = express();

app.use(express.json());

app.use(employeeRoutes);

app.listen(10000, () => {
    console.log(`Server is running on port 10000`);
});
