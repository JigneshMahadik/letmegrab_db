const db = require("../Config/db");
const { body, validationResult } = require("express-validator");


// Get all employees
const getEmployees = async (req, res) => {
    let page = parseInt(req.query.page) || 1; // Default to page 1
    let limit = parseInt(req.query.limit) || 5; // Default to 5

    // Validate page number before any operation
    if (!page || page < 1) {
        return res.status(400).json({ error: "Invalid page number. It must be a positive integer." });
    }
    let offset = (page - 1) * limit; // Calculate offset

    const query = `
        SELECT e.id, e.name, e.dob, e.phone, e.photo, e.email, e.salary, e.status, d.name AS department_name
        FROM employee e
        JOIN department d ON e.department_id = d.id
        LIMIT ? OFFSET ?
    `;

    db.query(query, [limit, offset], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        // Get total employee count for pagination info
        db.query("SELECT COUNT(*) AS total FROM employee", (countErr, countResult) => {
            if (countErr) return res.status(500).json({ error: countErr.message });

            let totalEmployees = countResult[0].total;
            let totalPages = Math.ceil(totalEmployees / limit);

            res.status(200).json({
                page,
                totalPages,
                totalEmployees,
                employees: results
            });
        });
    });
};


// Add a new employee
const addEmployee = async (req, res) => {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { department_id, name, dob, phone, photo, email, salary, status } = req.body;

    // Check if phone number already exists
    db.query("SELECT * FROM employee WHERE phone = ?", [phone], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        if (results.length > 0) {
            return res.status(400).json({ error: "Phone number already exists." });
        }

        // Insert new employee
        const employeeData = { department_id, name, dob, phone, photo, email, salary, status };
        db.query("INSERT INTO employee SET ?", employeeData, (insertErr, result) => {
            if (insertErr) return res.status(500).json({ error: insertErr.message });

            res.status(201).json({ message: "Employee added successfully", id: result.insertId });
        });
    });
};


// Edit an existing employee
const editEmployee = async (req, res) => {
    const { email } = req.params; // Get email from URL
    const { department_id, name, dob, phone, photo, salary, status } = req.body;

    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Check if employee exists based on email
    db.query("SELECT * FROM employee WHERE email = ?", [email], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        if (results.length === 0) {
            return res.status(404).json({ error: "Employee not found with this email" });
        }

        // Check if phone number is already taken (excluding the current employee)
        db.query("SELECT * FROM employee WHERE phone = ? AND email != ?", [phone, email], (phoneErr, phoneResults) => {
            if (phoneErr) return res.status(500).json({ error: phoneErr.message });

            if (phoneResults.length > 0) {
                return res.status(400).json({ error: "Phone number already exists." });
            }

            // Update employee
            const updateQuery = `
                UPDATE employee 
                SET department_id=?, name=?, dob=?, phone=?, photo=?, salary=?, status=? 
                WHERE email=?
            `;
            db.query(updateQuery, [department_id, name, dob, phone, photo, salary, status, email], (updateErr) => {
                if (updateErr) return res.status(500).json({ error: updateErr.message });

                res.status(200).json({ message: "Employee updated successfully" });
            });
        });
    });
};



// Delete employee based on email
const deleteEmployee = (req, res) => {
    const email = req.params.email;

    if (!email) {
        return res.status(400).json({ error: "Email is required in URL parameter." });
    }

    db.query("DELETE FROM employee WHERE email = ?", [email], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Employee not found with this email." });
        }

        res.status(200).json({ message: "Employee deleted successfully." });
    });
};


// Get highest salary employee of each department
const getHighestSalaryByDepartment = (req, res) => {
    const query = `
        SELECT d.name AS department_name, e.name AS employee_name, e.salary
        FROM employee e
        INNER JOIN department d ON e.department_id = d.id
        WHERE e.salary = (
            SELECT MAX(salary)
            FROM employee
            WHERE department_id = e.department_id
        )
        ORDER BY d.name;
    `;

    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        if (results.length === 0) {
            return res.status(404).json({ error: "No data found." });
        }

        res.status(200).json(results);
    });
};



// Employee count by salary range
const getEmployeeCountBySalaryRange = (req, res) => {
    const query = `
        SELECT CASE 
            WHEN salary >= 0 AND salary <= 50000 THEN '0-50000'
            WHEN salary > 50000 AND salary <= 100000 THEN '50001-100000'
            ELSE '100000+'
        END AS salary_range,
        COUNT(*) AS employee_count
        FROM employee
        GROUP BY salary_range;
    `;

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(results);
    });
};


// Name and age of the youngest employee of each department.
const getYoungestEmployeePerDepartment = (req, res) => {
    const query = `
        SELECT 
            d.name AS department_name, 
            e.name AS employee_name, 
            TIMESTAMPDIFF(YEAR, e.dob, CURDATE()) AS age
        FROM employee e
        JOIN department d ON e.department_id = d.id
        WHERE e.dob = (
            SELECT MIN(dob) FROM employee WHERE department_id = e.department_id
        )
        GROUP BY e.department_id;
    `;

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(results);
    });
};




// ✅ Validation Middleware
const validateEmployee = [
    body("department_id").notEmpty().withMessage("Department ID is required"),
    body("name").notEmpty().withMessage("Name is required"),
    body("dob").notEmpty().withMessage("Date of birth is required"),
    body("phone").notEmpty().isNumeric().withMessage("Valid phone number is required"),
    // body("email").isEmail().withMessage("Valid email is required"),
    body("salary").notEmpty().isNumeric().withMessage("Salary must be a number"),
    body("status").notEmpty().withMessage("Status is required"),
];


const employeeController = {
    getEmployees,
    validateEmployee,
    addEmployee,
    editEmployee,
    deleteEmployee,
    getHighestSalaryByDepartment,
    getEmployeeCountBySalaryRange,
    getYoungestEmployeePerDepartment
};

module.exports = employeeController;