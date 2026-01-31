// seed.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Doctor = require("./models/Doctor");

dotenv.config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB ✔");

    // Remove old doctors
    await Doctor.deleteMany();
    console.log("Old doctors removed.");

    // Insert new doctors
    await Doctor.insertMany([
      {
        name: "Dr. Ratnesh Kumar Jha",
        specialization: "Cardiologist",
        experience: 8,
        location: "Patna",
        description: "Expert in cardiac care.",
        image: "http://localhost:8000/uploads/doctor1.jpg"
      },
      {
        name: "Dr. Nitesh Pandey",
        specialization: "Dermatologist",
        experience: 5,
        location: "Delhi",
        description: "Specialist in skin and hair treatment.",
        image: "http://localhost:8000/uploads/doctor2.jpg"
      },
      {
        name: "Dr. Rishabh Kumar",
        specialization: "Neurologist",
        experience: 10,
        location: "Mumbai",
        description: "Brain & nerve specialist.",
        image: "http://localhost:8000/uploads/doctor3.jpg"
      }
    ]);

    console.log("Doctors saved successfully! 🎉");
    process.exit();
  })
  .catch(err => {
    console.error("Error seeding doctors:", err);
    process.exit(1);
  });
