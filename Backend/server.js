// Import necessary modules for backend setup
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors');
app.use(cors());

// Middleware for parsing requests
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/healthcare', {
    
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => console.log('Connected to MongoDB'));

// Define schema and models
const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    wallet: Number
});
const DoctorSchema = new mongoose.Schema({
    name: String,
    specialization: String
});
const AppointmentSchema = new mongoose.Schema({
    patientId: mongoose.Schema.Types.ObjectId,
    doctorId: mongoose.Schema.Types.ObjectId,
    date: Date,
    discounted: Boolean
});

const User = mongoose.model('User', UserSchema);
const Doctor = mongoose.model('Doctor', DoctorSchema);
const Appointment = mongoose.model('Appointment', AppointmentSchema);

app.post('/add-patient', async (req, res) => {
    const { name, email, phoneNumber, wallet } = req.body;

    try {
        const newPatient = new User({
            name,
            email,
            phoneNumber,
            wallet: wallet || 0,  // Default wallet to 0 if not provided
        });
        console.log('New Patient Object (Before Save):', newPatient);

        await newPatient.save();
        console.log('New Patient Saved:', newPatient);

        res.status(201).json({ message: 'Patient added successfully', patientId: newPatient._id.toString()  });
    } catch (error) {
        res.status(500).json({ error: 'Error adding patient', details: error.message });
    }
});

app.post('/book-appointment', async (req, res) => {
    const { patientId, doctorId, date } = req.body;

    try {
        // Ensure that patientId and doctorId are valid ObjectIds
        if (!mongoose.Types.ObjectId.isValid(patientId)) {
            return res.status(400).json({ error: 'Invalid patient ID' });
        }
        if (!mongoose.Types.ObjectId.isValid(doctorId)) {
            return res.status(400).json({ error: 'Invalid doctor ID' });
        }

        // Convert IDs to ObjectId type
        const doctorObjectId = new mongoose.Types.ObjectId(doctorId);
        const patientObjectId = new mongoose.Types.ObjectId(patientId);

        const existingAppointment = await Appointment.findOne({ patientId: patientObjectId, doctorId: doctorObjectId });

        let discounted = false;
        if (!existingAppointment) {
            // Apply first-time discount
            const patient = await User.findById(patientObjectId);

            if (!patient) {
                return res.status(404).json({ error: 'Patient not found' });
            }

            const discountAmount = 50; // Example discount amount

            if (patient.wallet >= discountAmount) {
                patient.wallet -= discountAmount;
                await patient.save();
                discounted = true;
            } else {
                return res.status(400).json({ error: 'Insufficient wallet balance for discount' });
            }
        }

        const appointment = new Appointment({ patientId: patientObjectId, doctorId: doctorObjectId, date, discounted });
        await appointment.save();
        res.status(200).json({ message: 'Appointment booked successfully', discounted });
    } catch (error) {
        res.status(500).json({ error: 'Error booking appointment', details: error.message });
    }
});

// Get all doctors (GET)
app.get('/doctors', async (req, res) => {
    try {
        const doctors = await Doctor.find({},'_id name specialization'); // Fetch all doctors from the database
        res.status(200).json(doctors);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching doctors', details: error.message });
    }
});


// Route to get financial report
app.get('/financial-report', async (req, res) => {
    try {
        const reports = await Appointment.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'patientId',
                    foreignField: '_id',
                    as: 'patient'
                }
            },
            {
                $lookup: {
                    from: 'doctors',
                    localField: 'doctorId',
                    foreignField: '_id',
                    as: 'doctor'
                }
            },
            {
                $project: {
                    patient: { $arrayElemAt: ['$patient.name', 0] },
                    doctor: { $arrayElemAt: ['$doctor.name', 0] },
                    date: 1,
                    discounted: 1
                }
            }
        ]);
        res.status(200).json(reports);
    } catch (error) {
        res.status(500).json({ error: 'Error generating financial report', details: error.message });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
