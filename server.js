require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
const admin = require("firebase-admin"); // Import Firebase Admin SDK
const { getHod, getMentor, setHod, setMentor } = require("./hodmentor");
// Initialize Express
const app = express();
const port = process.env.PORT || 3000;

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.applicationDefault(), // Use your Firebase credentials
});

// Utility Functions
const makePostRequest = async (url, data, headers = {}) => {
  const response = await axios.post(url, data, { headers });
  return response.data;
};

// Middleware
app.use(
  cors({
    origin: "*", // Be more specific in production
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept"],
  })
);
app.use(express.json());

// MongoDB connection
mongoose
  // .connect("mongodb://localhost:27017/nps", {
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Import Models
const Student = require("./models/Student");
const Faculty = require("./models/Faculty");
const Admin = require("./models/Admin");
const Security = require("./models/Security");
const Request = require("./models/Request");
const Outgoing = require("./models/Outgoing");

// Basic Routes
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Authentication Routes
app.post("/api/auth/student", async (req, res) => {
  try {
    console.log(req.body);
    const student = await Student.findOne({
      rollNo: req.body.rollNo,
      password: req.body.password,
    });

    if (student) {
      res.json({
        success: true,
        student: {
          rollNo: student.rollNo,
          branch: student.branch,
          year: student.year,
          section: student.section,
          mentor: student.mentor,
          hod: student.hod,
          phone: student.phone,
          uname: student.uname,
        },
      });
    } else {
      try {
        const externalResponse = await axios.post(
          "https://spectraserver-indol.vercel.app/api/search",
          { searchInput: req.body.rollNo }
        );

        if (externalResponse.data && externalResponse.data.length > 0) {
          const externalStudent = externalResponse.data[0];
          const newStudent = new Student({
            rollNo: req.body.rollNo,
            password: externalStudent.lastname,
            uname: externalStudent.firstname || "Unknown",
            branch: externalStudent.dept || "Unknown",
            year: externalStudent.currentyear || "Unknown",
            section: externalStudent.section || "Unknown",
            phone: externalStudent.phone || "Unknown",
            mentor: process.env.DEFAULT_MENTOR,
            hod: process.env.DEFAULT_HOD,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          await newStudent.save();

          res.json({
            success: true,
            student: {
              rollNo: newStudent.rollNo,
              branch: newStudent.branch,
              year: newStudent.year,
              section: newStudent.section,
              mentor: await getMentor(
                `${newStudent.year}${newStudent.branch}${newStudent.section}`
              ),
              hod: await getHod(`${newStudent.year}${newStudent.branch}`),
              phone: newStudent.phone,
              uname: newStudent.uname,
            },
            message: "Account created successfully",
          });
        } else {
          res.status(401).json({
            success: false,
            message: "Student not found in external database",
          });
        }
      } catch (externalError) {
        console.error("External API Error:", externalError);
        res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }
    }
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.post("/api/auth/faculty", async (req, res) => {
  try {
    const faculty = await Faculty.findOne({
      uname: req.body.username,
      password: req.body.password,
    });

    if (faculty) {
      res.json({
        success: true,
        faculty: {
          username: faculty.username,
          department: faculty.department,
        },
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.post("/api/auth/admin", async (req, res) => {
  try {
    const admin = await Admin.findOne({
      uname: req.body.username,
      password: req.body.password,
    });

    if (admin) {
      res.json({
        success: true,
        admin: {
          uname: admin.uname,
          createdAt: admin.createdAt,
        },
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.post("/api/auth/security", async (req, res) => {
  try {
    const security = await Security.findOne({
      uname: req.body.username,
      password: req.body.password,
    });

    if (security) {
      res.json({
        success: true,
        security: {
          uname: security.uname,
          createdAt: security.createdAt,
        },
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Request Routes
app.post("/api/requests", async (req, res) => {
  try {
    console.log(req.body);
    const request = new Request({
      ...req.body,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    axios.post(process.env.NATIVENOTIFY_API_URL, {
      subID: req.body.to,
      appId: process.env.NATIVENOTIFY_APP_ID,
      appToken: process.env.NATIVENOTIFY_APP_TOKEN,
      title: "New Leave Request",
      message: "A new leave request has been made by " + req.body.rollNo,
    });

    await request.save();
    res.status(201).json({ success: true, request });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/requests/:rollNo", async (req, res) => {
  try {
    const requests = await Request.find({ rollNo: req.params.rollNo }).sort({
      createdAt: -1,
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Faculty Request Routes
app.get("/api/faculty/requests/:uname", async (req, res) => {
  try {
    const requests = await Request.find({
      to: req.params.uname,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.post("/api/faculty/request-action", async (req, res) => {
  try {
    const { requestId, action } = req.body;
    console.log(req.body);
    const request = await Request.findByIdAndUpdate(
      requestId,
      {
        status: action === "approve" ? "admin pending" : "rejected",
        updatedAt: new Date(),
      },
      { new: true }
    );
    axios.post(process.env.NATIVENOTIFY_API_URL, {
      subID: request.rollNo,
      appId: process.env.NATIVENOTIFY_APP_ID,
      appToken: process.env.NATIVENOTIFY_APP_TOKEN,
      title: "Leave Request Status",
      message:
        "Your leave request has been " +
        (action === "approve" ? "sent to admin" : "rejected"),
    });

    // Fetch all admins
    const admins = await Admin.find();

    // Send notifications to all admins
    for (const admin of admins) {
      axios.post(process.env.NATIVENOTIFY_API_URL, {
        subID: admin.uname, // Assuming 'uname' is the identifier for the admin
        appId: process.env.NATIVENOTIFY_APP_ID,
        appToken: process.env.NATIVENOTIFY_APP_TOKEN,
        title: "Leave Request Status",
        message:
          "A leave request has been " +
          (action === "approve" ? "sent to admin" : "rejected"),
      });
    }

    console.log(request.rollNo);
    if (request) {
      res.json({
        success: true,
        message:
          action === "approve" ? "Request sent to admin" : "Request rejected",
        request,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Admin Request Routes
app.get("/api/admin/requests", async (req, res) => {
  try {
    const requests = await Request.find({
      status: "admin pending",
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.post("/api/admin/request-action", async (req, res) => {
  try {
    const { requestId, action } = req.body;

    const request = await Request.findByIdAndUpdate(
      requestId,
      {
        status: action === "approve" ? "approved" : "rejected",
        updatedAt: new Date(),
      },
      { new: true }
    );
    axios.post(process.env.NATIVENOTIFY_API_URL, {
      subID: request.rollNo,
      appId: process.env.NATIVENOTIFY_APP_ID,
      appToken: process.env.NATIVENOTIFY_APP_TOKEN,
      title: "Leave Request Status",
      message:
        "Your leave request has been " +
        (action === "approve" ? "approved" : "rejected"),
    });

    if (request) {
      if (action === "approve") {
        const newOutgoing = new Outgoing({
          rollNo: request.rollNo,
          reason: request.reason,
          time: request.time,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await newOutgoing.save();
      }

      res.json({
        success: true,
        message:
          action === "approve"
            ? "Request approved and added to outgoings"
            : "Request rejected",
        request,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }
  } catch (error) {
    console.error("Error handling request action:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Security Request Approval Route
app.post("/api/security/request-action", async (req, res) => {
  try {
    const { requestId, action } = req.body;

    if (action === "approve") {
      // Find the request
      const request = await Request.findById(requestId);

      if (request) {
        // Remove the request from the requests collection
        await Request.findByIdAndDelete(requestId);

        // Remove the corresponding outgoing record
        await Outgoing.findOneAndDelete({
          rollNo: request.rollNo,
          reason: request.reason,
        });

        res.json({
          success: true,
          message: "Request approved and removed from records",
        });
      } else {
        res.status(404).json({
          success: false,
          message: "Request not found",
        });
      }
    } else {
      res.status(400).json({
        success: false,
        message: "Invalid action",
      });
    }
  } catch (error) {
    console.error("Error handling security request action:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Student Routes
app.get("/api/users", async (req, res) => {
  try {
    const users = await Student.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error retrieving users", error: err });
  }
});

app.get("/api/student/attendance/:rollNo", async (req, res) => {
  try {
    const searchResponse = await makePostRequest(
      `${process.env.EXTERNAL_API_URL}/api/search`,
      { searchInput: req.params.rollNo }
    );

    if (searchResponse && searchResponse[0]) {
      const data2 = {
        mobileNumber: searchResponse[0].phone,
        password: searchResponse[0].lastname,
      };

      const tokenResponse = await makePostRequest(
        `${process.env.EXTERNAL_API_URL}/api/get-token`,
        data2
      );

      const attendanceResponse = await makePostRequest(
        `${process.env.EXTERNAL_API_URL}/api/attendance`,
        { method: "314" },
        {
          Authorization: `Bearer ${tokenResponse.token}`,
          "Content-Type": "application/json",
        }
      );

      res.json({
        success: true,
        attendance: attendanceResponse.totalPercentage,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance",
    });
  }
});

// Outgoing Routes
app.get("/api/outgoings", async (req, res) => {
  try {
    const outgoings = await Outgoing.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      outgoings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.delete("/api/outgoings/:id", async (req, res) => {
  try {
    const outgoing = await Outgoing.findByIdAndDelete(req.params.id);

    if (outgoing) {
      res.json({
        success: true,
        message: "Record deleted successfully",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Faculty Registration Route
app.post("/api/register-faculty", async (req, res) => {
  const { facultyName, password, role, branch, year, section } = req.body;

  try {
    // Create username from faculty name (e.g., first letter of each word)

    // Create new faculty record
    const faculty = new Faculty({
      name: facultyName,
      password: password,
      uname: facultyName,
      role: role,
      branch: branch,
      year: year,
      section: section,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await faculty.save();

    // Update students based on role
    if (role === "hod") {
      // Update all students in the branch to have this HOD
      await Student.updateMany(
        { branch: branch },
        { $set: { hod: facultyName } }
      );
      await setHod(`${year}${branch}`, facultyName);
    } else if (role === "mentor") {
      // Update students in specific branch, year and section to have this mentor
      await Student.updateMany(
        {
          branch: branch,
          year: year,
          section: section,
        },
        { $set: { mentor: facultyName } }
      );
      await setMentor(`${year}${branch}${section}`, facultyName);
    }

    // Generate CSV report

    res.json({
      success: true,
      message: "Faculty registered successfully",
      faculty: {
        name: facultyName,
        role: role,
        uname: facultyName,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to register faculty member",
    });
  }
});

// Graduates Routes
app.get("/api/students/graduates", async (req, res) => {
  try {
    const result = await Student.deleteMany({ year: 4 }); // Assuming there's a 'graduated' field in the Student model
    await Student.deleteMany({});
    res.json({
      success: true,
      deletedCount: result.deletedCount, // Return the number of deleted graduates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
