const express = require("express");
const router = express.Router();

const employeeController = require("../Controllers/employeeController")

router.get("/employee", employeeController.getEmployees);

router.post("/employee", employeeController.validateEmployee, employeeController.addEmployee);

router.put("/employee/:email", employeeController.validateEmployee, employeeController.editEmployee);

router.delete("/employee/:email", employeeController.deleteEmployee);

router.get("/employee/highestSalary", employeeController.getHighestSalaryByDepartment);

router.get("/employee/salaryRangeCount", employeeController.getEmployeeCountBySalaryRange);

router.get("/employee/youngestEmployees", employeeController.getYoungestEmployeePerDepartment);

module.exports = router;